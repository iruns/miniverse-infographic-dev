/*
This expands a dataSetConfig so it can be converted to an pgSqlFunction by SqlFunctionConverter.
Before this, the config should be converted from rawDataSetConfig
*/

import _ from 'lodash';

// expand id. Differentiate between ids, settings, and props
exports.expandIds = function(ids){

    const xIds = [];
    const vars = [];

    ids.map(id => {
        // if direct ids, differentiate between entity and prop, then convert to int
        if(_.isArray(id)){
            id.map(id0 => {
                xIds.push((parseInt(id0.substring(1)) * 10) + (id0.substring(0,1) == "P" ? 1 : 0));
            })
        }
        // else if settings or var
        else
            vars.push(id);
    })

    // put the direct ids to an array
    if(xIds.length > 0)
        vars.push(xIds);

    return vars;
}

// expand boolean fields. Differentiate between direct value, settings/vars, and undefined
exports.expandBool = function(prop){
    // if undefined, false
    if(prop == undefined)
        return false;
    // else, if there is an _active setting, return it
    else if(prop._active != undefined){
        if(typeof prop._active == "boolean")
            return prop._active;
        if(typeof prop._active == "string")
            return prop._active;
    }
    // else, return true
    else
        return true;
}

// TODO move this to convertRawConfig
// exports.convertToSqlNames = function(object, sortedLists){
//
//     _.forEach(object, (value, key) => {
//
//         // if a name (string)
//         if(typeof value != "string"){
//
//             // if setting, change to p(arams)
//             if(_.startsWith(value, "=_settings."))
//                 object[key] = "p" + sortedLists._settings.indexOf(value.substring(11));
//
//             // if var, change to p(arams)
//             else if(_.startsWith(value, "="))
//                 object[key] = "v" + sortedLists._vars.indexOf(value.substring(1));
//
//             // else, it's group name
//         }
//
//         // else if object, drill down
//         exports.convertToSqlNames(value, sortedLists);
//     })
// }
//

exports.expandFilter = function({queries, props, propQueryProps, variable, idx, filter}){

    // do and delete filter settings


    // if id filter, assign ids to group var
    if(filter._ids != undefined){
        propQueryProps[variable + idx] = exports.expandIds(filter._ids);
        return;
    }

    // if class filter, add query
    if(filter._class != undefined){
        queries.push({
            type: "class",
            group: idx,
            classes: filter._class
        })

        delete filter._class;
    }

    // if connectedTo filter, add query
    if(filter._connected != undefined){
        const connected = filter._connected;
        queries.push({
            type: "connectedTo",
            group: idx,

            entities: exports.expandIds(connected._to),

            upProps: exports.expandIds(connected._upProps),
            downProps: exports.expandIds(connected._downProps),

            upDepth: connected._upDepth,
            downDepth: connected._downDepth,
            cousinDepth: connected._cousinDepth,
        })

        delete filter._connected;
    }

    // other props
    const otherProps = _.keys(filter);
    if(otherProps.length > 0){

        const subs = [];

        queries.push({
            type: "props",
            group: idx,

            subs: subs,
        })

        _.forEach(filter, (prop, propName) => {

            const propType = props[propName]._type;

            const newProp = {
                table: propType,
                prop: propName
            }

            subs.push(newProp);

            // if entity_ref OR string OR globe_coordinates,
            // do query based on exact value
            if(
                propType == "entity_ref" ||
                propType == "string" ||
                propType == "globe_coordinates"
            ){
                newProp.exacts = {
                    value: prop._is
                }
            }
            else if(propType == "quantity"){
                newProp.exacts = {
                    value: prop._is
                }
            }
        })
    }
}


exports.expand = function(config){

    // shortcuts
    const groups = config._groups;
    const props = config._props;
    const fixedVars = config._fixed_vars;
    const settings = config._settings;


    const xParams = {};
    const xVars = {};
    const xQueries = [];

    const xConfig = {
        params: xParams,
        vars: xVars,
        queries: xQueries,
    }

    // --PARAMS--
    settings.map((setting, si) => {
        // add to variable declaration
        xParams["s" + si] = {type: setting._type};
    })


    // --FIXED VARS--
    //      iterate
    fixedVars.map((fixedVar, vi) => {

        // add to variable declaration
        xVars["v" + vi] = {
            type: fixedVar._type,
            vals: exports.expandIds(fixedVar._vals),
        };
    })


    // --PROPS--
    //      add query for prop value filling
    const propQuery = {
        type: "props",
        props: {}
    }
    xQueries.push(propQuery);

    //      iterate
    props.map((prop, pi) => {

        // add to variable declaration
        xVars["vp" + pi] = {type: "id_array"};

        // add to prop value filling query
        propQuery.props["vp" + pi] = exports.expandIds(prop._ids);
    })

    // --GROUPS--
    groups.map((group, gi) => {

        // --PROCESS GROUP PARAMS--
        xParams["sg"+gi+"e"] = {type: "id_array"};
        // var for collecting group
        xVars["g"+gi] = {type: "id_array"};


        // --PROCESS FILTER--
        exports.expandFilter({
            queries: xQueries,
            propQueryProps: propQuery.props,
            variable: "g",
            idx: gi,
            filter: group._where,
        });

        // --PROCESS PROPS--
        const props = group._get._props;
        const identities = group._get._identities

        // create query and fill identities
        const xQuery = {
            type: 'claim',
            group: gi,

            identities: {
                label: exports.expandBool(identities._label),
                alias: exports.expandBool(identities._alias),
                description: exports.expandBool(identities._description),
                sitelink: exports.expandBool(identities._sitelink),
                class: exports.expandBool(identities._class),
            }
        };

        // fill the rest of the props
        if(props != undefined){

            xQuery.props = {};

            _.forEach(props, (groupProp, pName) => {

                const gpi = parseInt(pName.substring(1));
                const prop = config._props[gpi];

                // if the propType doesn't exist yet, create
                let propByType = xQuery.props[prop._prop_type];
                if(propByType == undefined)
                    xQuery.props[prop._prop_type] = propByType = [];

                // then fill
                //      if no active var
                if(groupProp._active == undefined)
                    propByType.push("vp"+gpi);
                //      else
                else{
                    const actProp = "vp"+gpi+"_a"+gi;
                    propByType.push(actProp);
                    // add to vars
                    xVars[actProp] = {type: "id_array"};
                    // add activate query before the claim query
                    xQueries.push({
                        type: 'activate',

                        bool: exports.expandBool(groupProp),
                        set: actProp,
                        to: "vp"+gpi
                    });
                }

            })
        }

        xQueries.push(xQuery);

        gi++;
    })

    return xConfig;
}
