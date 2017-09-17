/*
This expands a dataSetConfig so it can be converted to an pgSqlFunction by SqlFunctionConverter.
Before this, the config should be converted from rawDataSetConfig
*/

import _ from 'lodash';
import hash from 'object-hash';

const defaultValues = {
    limit: 50,
    order: "DESC",
}

function isVar(variable){
    return (typeof variable == "string" && variable.substring(0,1) == "=");
}

// if ends with p+number
function isPropVal(variable){
    return (variable.match(/p[0-9]+$/) != null);
}

function toVar({variable, postFix, groupValues}){

    // if from a group's property value AND is a prop
    if(
        variable.substring(1,2) == "g" &&
        isPropVal(variable)
    ){

        // remove "="
        variable = variable.substring(1);

        // add groupValue
        const parts = variable.split("_");

        //      add or create group
        const groupName = parts.shift();
        let group = groupValues[groupName];
        if(group == undefined)
            group = groupValues[groupName] = {
                props: [],
                qualifiers: {},
                references: {},
            };

        //      add or create prop in group
        //          if a claim
        if(parts.length == 1){
            if(group.props.indexOf(parts[0]) == -1)
                group.props.push(parts[0]);
        }

        //          if a qualifier or a reference

        if(
            parts.length == 3 ||
            parts.length == 4
        ){

            let container;
            let prop = "";

            // if qualifier
            if(parts[1] == "q"){
                container = group.qualifiers;
                prop = parts[3];
            }

            // if reference
            if(parts[1] == "r"){
                container = group.references;
                prop = parts[2];
            }

            // add prop if it doesn't exist yet
            let detailProps = container[parts[0]];
            if(detailProps == undefined)
                detailProps = container[parts[0]] = [];

            if(detailProps.indexOf(prop) == -1)
                detailProps.push(prop);

        }
        // add postFix
        return variable + (postFix == undefined ? "" : "_"+postFix);
    }
    // else, ignore the postFix
    else
        return variable.substring(1);
}

function extractVars(vals){

    const vars = [];
    vals.map(val => {
        if(typeof val == "string" && val.substring(0,1) == "=")
            vars.push(val);
    })
    return vars;
}



// differentiate between direct val and var
function doObjects({objs, postFix, groupValues}){

    const directVals = [];
    const vars = [];

    objs.map(obj => {
        // if NOT direct value, directly add
        if(isVar(obj))
            vars.push(toVar({
            	variable: obj,
            	postFix: postFix,
            	groupValues: groupValues
            }));
        // else, add to directVals
        else
            directVals.push(obj);
    })

    // put the direct id to an array
    if(directVals.length > 0)
        vars.unshift(directVals);

    return vars;
}

// differentiate between direct val and var
function doObject({obj, postFix, groupValues}){
    if(obj == undefined)
        return 0;

    if(isVar(obj))
        return toVar({
        	variable: obj,
        	postFix: postFix,
        	groupValues: groupValues
        });

    return obj;
}


// expand id. Differentiate between id, settings, and props
function doIds({ids, postFix, groupValues}){

    ids = doObjects({
    	objs: ids,
    	postFix: postFix,
    	groupValues: groupValues
    });

    const directIds = ids[0];

    // if there are direct id
    if(_.isArray(directIds))
        directIds.map((id, idx) => {
            directIds[idx] = (parseInt(id.substring(1)) * 10) + (id.substring(0,1) == "P" ? 1 : 0);
        })

    return ids;
}

function doDates({dates, postFix, groupValues}){
    const directVals = [];
    const vars = [];
    const zero = new Date("0001-01-01");

    dates.map(date => {
        // if NOT direct value, directly add
        if(isVar(date))
            vars.push(toVar({
            	variable: date,
            	postFix: postFix,
            	groupValues: groupValues
            }));
        // else, convert to days and add to directVals
        else {

            const isBce = (date.substring(0,1) == "-");

            if(isBce)
                date = date.substring(1);

            //splt parts and convert to acceptable values
            const parts = date.split("-").map(part => {
                part = parseInt(part);
                if(part == 0)
                    part = 1;
                return part;
            });

            // get bce years from year
            let bceYears = 0;
            if(isBce){
                bceYears = parts[0];
                parts[0] = 1;
            }

            // if complete date
            if(parts.length == 3)
                date = new Date(
                    pad(parts[0], 4) + "-" +
                    pad(parts[1], 2) + "-" +
                    pad(parts[2], 2)
                );

            // if just years
            else if(parts.length == 1)
                date = new Date(pad(parts[0], 4) + "-01-01");

            date = Math.round((date - zero) / (1000*60*60*24)) - Math.round(bceYears * 365.2422);
            directVals.push(date);
        }
    })

    // put the direct id to an array
    if(directVals.length > 0)
        vars.unshift(directVals);

    return vars;
}

function doInterval(int){

    // if undefined
    if(int == undefined)
        return 0;

    // if var
    if(isVar(int))
        return toVar({variable: int});

    // if direct objber (day)
    if(typeof int == "number")
        return int;

    // then it's an interval object
    let days = int.y != undefined ? int.y * 365.2422: 0;
    days += int.m != undefined ? int.m * 30: 0;
    days += int.d != undefined ? int.d: 0;

    return Math.round(days);
}

function doProps(props){

    let result = [];

    if(props != undefined){
        props.map(prop => {
            result.push(prop.substr(1));
        })
    }

    return result;
}

// pad number string with 0s to a minimal length
function pad(obj, size) {
    var s = "000" + obj;
    return s.substr(s.length-size);
}


function doStrings({strings, postFix, groupValues}){
    const directVals = [];
    const vars = [];

    strings.map(string => {
        // if NOT direct value, directly add
        if(isVar(string))
            vars.push(toVar({
            	variable: string,
            	postFix: postFix,
            	groupValues: groupValues
            }));
        // else, add to directVals
        else
            directVals.push("'"+string+"'");
    })

    // put the direct id to an array
    if(directVals.length > 0)
        vars.unshift(directVals);

    return vars;
}

// differentiate between direct val and var, and add quotes to actual string
function doString({string, postFix, groupValues}){
    if(isVar(string))
        return toVar({
        	variable: string,
        	postFix: postFix,
        	groupValues: groupValues
        });

    return "'"+string+"'";
}


// expand boolean fields. Differentiate between direct value, settings/vars, and undefined
function doIf(prop, groupValues){
    // if undefined, false
    if(prop == undefined)
        return false;
    // else, if there is an active setting, return it
    else if(prop.if != undefined){
        if(typeof prop.if == "boolean")
            return prop.if;
        if(isVar(prop.if))
            return toVar({
            	variable: prop.if,
            	groupValues: groupValues
            });
    }
    // else, return true
    else
        return true;
}




function expandFilter({queries, props, groupValues, groupidx, filter}){

    const query = {};
    queries.push(query);

    // if id filter, assign id to group var
    if(filter.id != undefined){
        query.type = "set";
        query.set = "g" + groupidx;
        query.to = doIds({
        	ids: filter.id,
            postFix: "v",
        	groupValues: groupValues
        });
        return;
    }

    // do and delete filter settings
    //      limit
    query.limit = defaultValues.limit; // default limit
    if(filter.limit != undefined){
        query.limit = doObject({
        	obj: filter.limit,
        	groupValues: groupValues
        });
        delete filter.limit;
    }


    query.group = groupidx;

    // if class filter, add query
    if(filter.class != undefined){

        query.type = "class_filter";
        query.class= doObjects({
        	objs: filter.class,
        	groupValues: groupValues
        });

        delete filter.class;
    }

    // if connected_to filter, add query
    if(filter.connected != undefined){
        const connected = filter.connected;

        query.type = "connected_to_filter",

        query.entities = doIds({
        	ids: connected.to,
            postFix: "v",
        	groupValues: groupValues
        });

        query.up_props = doProps(connected.up_props);
        query.down_props = doProps(connected.down_props);

        query.up_depth = doObject({
        	obj: connected.up_depth,
        	groupValues: groupValues
        });
        query.down_depth = doObject({
        	obj: connected.down_depth,
        	groupValues: groupValues
        });
        query.cousin_depth = doObject({
        	obj: connected.cousin_depth,
        	groupValues: groupValues
        });

        delete filter.connected;
    }

    // save and delete "orderings" and "offset" setting
    const orderings = filter.orderings;
    delete filter.orderings;

    const offset = filter.offset;
    delete filter.offset;


    // other props
    const other_props = _.keys(filter);
    if(other_props.length > 0){

        // do "orderings" and "offset" setting
        if(orderings != undefined){
            query.orderings = [];
            orderings.map(ordering => {
                query.orderings.push({
                    order_by: ordering.order_by.substring(1),
                    order: (ordering.order == undefined ? defaultValues.order : ordering.order)
                })
            })
        }
        if(offset != undefined){
            query.offset = doObject({
                obj: offset,
                groupValues: groupValues
            });
        }

        // then do the actual props
        query.type = "props_filter";
        expandPropFilter({
            query: query,
            groupValues: groupValues,
            props: props,
            filter: filter
        });
    }
}

function expandPropFilter({query, props, groupValues, filter, detailType}){

    const subs = [];

    query.subs = subs;

    _.forEach(filter, (prop, propName) => {

        const propType = props[parseInt(propName.substring(1))].prop_type;

        const newProp = {
            table: propType,
            prop: propName
        }

        subs.push(newProp);

        // active var
        if(prop.if != undefined){
            newProp.if = doIf(prop);
            delete prop.if;
        }

        // if entity_ref OR string OR globe_coordinates,
        // do query based on exact value
        if(
            propType == "entity_ref" ||
            propType == "string" ||
            propType == "globe_coordinates"
        ){
            newProp.exacts = {
                value: doObjects({
                	objs: prop.is,
                	postFix: "v",
                	groupValues: groupValues
                })
            }
        }

        // quantity
        else if(propType == "quantity"){

            const amount = {};
            newProp.ranges = {amount: amount};

            // if not from a group's prop value
            if(prop.is == undefined){
                newProp.exacts = {
                    unit: doStrings({
                    	strings: prop.unit,
                    	postFix: "v4",
                    	groupValues: groupValues
                    })
                }
                amount.points = doObjects({
                	objs: prop.amount,
                	postFix: "v",
                	groupValues: groupValues
                });
            }
            // else if from a group's prop value
            else {
                newProp.exacts = {
                    unit: extractVars(prop.is).map(string => toVar({
                    	variable: string,
                    	postFix: "v4",
                    	groupValues: groupValues
                    }))
                }

                amount.points = doObjects({
                	objs: prop.is,
                	postFix: "v",
                	groupValues: groupValues
                });
            }

            // add ranges
            amount.lower_range = doObject({
            	obj: prop.lower_range,
            	groupValues: groupValues
            });
            amount.upper_range = doObject({
            	obj: prop.upper_range,
            	groupValues: groupValues
            });
        }

        // datetime
        else if(propType == "datetime"){

            const datetime = {};
            newProp.ranges = {datetime: datetime};

            // if not from a group's prop value
            if(prop.is == undefined){
                newProp.exacts = {};

                // if undefined, use default
                if(prop.calendar_model_id == undefined)
                    newProp.exacts.calendar_model_id = [[19857270]];
                else
                    newProp.exacts.calendar_model_id = doIds({
                    	ids: prop.calendar_model_id,
                    	postFix: "v4",
                    	groupValues: groupValues
                    });

                datetime.points = doDates({
                	dates: prop.datetime,
                	postFix: "v",
                	groupValues: groupValues
                });
            }
            // else if from a group's prop value
            else {
                newProp.exacts = {
                    calendar_model_id: extractVars(prop.is).map(string => toVar({
                    	variable: string,
                    	postFix: "v4",
                    	groupValues: groupValues
                    }))
                }

                datetime.points = doDates({
                	dates: prop.is,
                	postFix: "v",
                	groupValues: groupValues
                });
            }

            // add ranges
            datetime.lower_range = doInterval(prop.lower_range);
            datetime.upper_range = doInterval(prop.upper_range);
        }

        // process if this is qualifiers and references
        if(detailType != undefined){

            newProp.detail_table = (detailType == "references" ? "claim_references" : "claim_qualifiers");

            switch (detailType) {
                case "qualifiers":
                    newProp.claim_prefix = "e";
                    break;
                // case "prop":
                //     newProp.claim_prefix = "p";
                //     break;
                // case "value":
                //     newProp.claim_prefix = "v";
                //     break;
                // case "claim":
                //     newProp.claim_prefix = "c";
                //     break;
                    break;
                case "references":
                    newProp.claim_prefix = "r";
                    break;
                default:

            }
        }

        // else if this is a claim, process qualifiers and references of this claim
        else if(prop.where != undefined){

            _.forEach(prop.where, (details, detailType) => {

                expandPropFilter({
                    query: newProp,
                    groupValues: groupValues,
                    props: props,
                    filter: details,
                    detailType: detailType
                })
            })

        }
    })

}



function includeGroupValues({xQuery, xVars, props, groupValues}){

    const currentGroupValues = groupValues["g"+xQuery.group];

    if(currentGroupValues != undefined){

        includeGroupValuesType({
            query: xQuery,
            valuesProps: currentGroupValues.props,
            prefixes: ["g0"],
            xVars: xVars,
            props: props
        })

        // for each exsisting subs
        xQuery.subs.map(sub => {

            // if it's qualifier,
            if(sub.type == "qualifier"){

                // and there are qualifiers for the prop
                const qualifierProps = currentGroupValues.qualifiers[sub.prop];

                if(qualifierProps != undefined){

                    includeGroupValuesType({
                        query: sub,
                        valuesProps: qualifierProps,
                        prefixes: ["g0",sub.prop,"q","e"],
                        xVars: xVars,
                        props: props
                    })
                }
            }

            // if it's reference,
            if(sub.type == "reference"){

                // and there are references for the prop
                const referenceProps = currentGroupValues.references[sub.prop];

                if(referenceProps != undefined){

                    includeGroupValuesType({
                        query: sub,
                        valuesProps: referenceProps,
                        prefixes: ["g0",sub.prop,"r"],
                        xVars: xVars,
                        props: props
                    })
                }
            }
        })


    }
}

function includeGroupValuesType({query, valuesProps, prefixes, xVars, props}){

    // create subs if one not exists
    if(query.subs == undefined)
        query.subs = [];

    // add each saved prop to the subs
    valuesProps.map(prop => {

        const propIdx = parseInt(prop.substring(1));
        const propType = props[propIdx].prop_type;

        const newValueVar = {
            type: 'value_var',
            prop: "p"+propIdx,
            vars: {}
        };

        // include group values in vars
        const prefix = prefixes.concat([prop]).join("_");

        newValueVar.vars.val = prefix + "_v";

        _.set(xVars, [prefix + "_v"], {});

        if(
            propType == "quantity" ||
            propType == "datetime"
        ){
            newValueVar.vars.val4 = prefix + "_v4";

            _.set(xVars, [prefix + "_v4"], {});
        }

        switch (propType) {
            case "entity_ref":
                xVars[prefix + "_v"].type = "id_array";
                break;

            case "string":
                xVars[prefix + "_v"].type = "string_255_array";
                break;

            case "globe_coords":
                xVars[prefix + "_v"].type = "globe_coords_array";
                break;

            case "quantity":
                xVars[prefix + "_v"].type = "quantity_array";
                xVars[prefix + "_v4"].type = "string_127_array";// unit
                break;

            case "datetime":
                xVars[prefix + "_v"].type = "big_int_array";// days
                xVars[prefix + "_v4"].type = "id_array";// calendar_model_id
                break;

            default:

        }

        query.subs.push(newValueVar);
    })
}




function expandFixedVars(fixedVars, xVars){

    fixedVars.map((fixedVar, vi) => {

        const varDeclaration = {
            type: fixedVar.type
        }
        xVars["fv" + vi] = varDeclaration;

        let val = fixedVar.val;
        const isArray = _.endsWith(fixedVar.type, "array");
        if(!isArray){
            val = [fixedVar.val];
        }

        // add to variable declaration
        if(_.startsWith(fixedVar.type, "id"))
            varDeclaration.val = doIds({ids: val});

        else if(_.startsWith(fixedVar.type, "datetime"))
            varDeclaration.val = doDates({dates: val});

        else
            varDeclaration.val = doObjects({objs: val});

        // if not array, open array
        if(!isArray){
            varDeclaration.val = varDeclaration.val[0];
            if(_.isArray(varDeclaration.val))
                varDeclaration.val = varDeclaration.val[0];
        }
    })
}

function expandProps(cProps, xVars, xQueries){
    cProps.map((prop, pi) => {

        // add to variable declaration
        xVars["p" + pi] = {type: "id_array"};

        // add prop value filling query
        xQueries.push({
            type: "set",
            set: "p" + pi,
            to: doIds({ids: prop.id})
        });
    })
}

function expandGroupProps({
    xQuery, xQueries, xVars, prefix, type, props, cProps
}){

    let propsObj = {};
    switch (type) {
        case "claim":
            xQuery.props = propsObj;
            break;
        case "qualifier":
            xQuery.qualifiers = propsObj;
            break;
        case "reference":
            xQuery.references = propsObj;
            break;
        default:
    }


    _.forEach(props, (groupProp, pName) => {

        const gpi = parseInt(pName.substring(1));
        const prop = cProps[gpi];

        // if the propType doesn't exist yet, create
        let propByType = propsObj[prop.prop_type];
        if(propByType == undefined)
            propsObj[prop.prop_type] = propByType = [];

        // then fill
        //      if no "if" var
        if(groupProp.if == undefined)
            propByType.push("p"+gpi);
        //      else
        else{

            const actProp = "v"+prefix+"_p"+gpi+"_a";
            propByType.push(actProp);

            // add to vars
            xVars[actProp] = {type: "id_array"};

            // add activate query before the claim query
            xQueries.push({
                type: 'set',

                if: doIf(groupProp),
                set: actProp,
                to: "p"+gpi
            });
        }

        // if claim, fill qualifiers and references
        if(type == "claim"){
            const details = groupProp.get;
            if(details != undefined){

                // create subs if one doesn't exits
                let xSub = xQuery.subs;
                if(xSub == undefined)
                    xSub = xQuery.subs = [];

                // fill qualifiers
                const qualifiers = details.qualifiers;
                if(qualifiers != undefined){

                    const qualifierQuery = {
                        type: "qualifier",
                        prop: pName
                    }

                    xSub.push(qualifierQuery);

                    expandGroupProps({
                        xQuery: qualifierQuery,

                        xQueries: xQueries,
                        xVars: xVars,
                        cProps: cProps,

                        type: "qualifier",
                        prefix: prefix+"_p"+gpi+"_q_e",
                        props: qualifiers,
                    })
                }

                // fill references
                const references = details.references;
                if(references != undefined){

                    const referenceQuery = {
                        type: "reference",
                        prop: pName
                    }

                    xSub.push(referenceQuery);

                    expandGroupProps({
                        xQuery: referenceQuery,

                        xQueries: xQueries,
                        xVars: xVars,
                        cProps: cProps,

                        type: "reference",
                        prefix: prefix+"_p"+gpi+"_r",
                        props: references,
                    })
                }
            }
        }
    })
}

function expandGroups({
    cGroups, cProps, xParams, xVars, xQueries
}){
    // temp container for groups' prop values that will be used by others
    const groupValues = {};

    cGroups.map((group, gi) => {

        // --PROCESS GROUP PARAMS--
        xParams["sg"+gi+"e"] = {type: "id_array"};
        // var for collecting group
        xVars["g"+gi] = {type: "id_array"};

        // --PROCESS FILTER--
        expandFilter({
            queries: xQueries,
            groupidx: gi,
            filter: group.where,

            queries: xQueries,
            props: cProps,
            groupValues: groupValues,
            groupidx: gi,
            filter: group.where,
        });

        // --PROCESS PROPS--
        const props = group.get.props;
        const identities = group.get.identities

        // create query and fill identities
        const xQuery = {
            type: 'claim',
            group: gi,

            identities: {
                label: doIf(identities.label),
                alias: doIf(identities.alias),
                description: doIf(identities.description),
                sitelink: doIf(identities.sitelink),
                class: doIf(identities.class),
            }
        };

        // fill the rest of the props
        if(props != undefined){

            expandGroupProps({
                xQuery: xQuery,

                xQueries: xQueries,
                xVars: xVars,
                cProps: cProps,

                type: "claim",
                prefix: "g"+gi,
                props: props,
            })
        }

        // if
        if(group.if != undefined)
            xQuery.if = doIf(group);

        xQueries.push(xQuery);
    })

    // if there are groupValues
    if(_.keys(groupValues).length > 0){

        // check every query
        xQueries.map(xQuery => {

            // if claim (group claim) check groupValues, then add value_var subs accordingly
            if(xQuery.type == "claim"){
                includeGroupValues({
                    xQuery: xQuery,
                    xVars: xVars,
                    props: cProps,
                    groupValues: groupValues
                })
            }
        })
    }
}


function expand (config){

    // shortcuts
    const cGroups = config.groups;
    const cProps = config.props;
    const cFixedVars = config.fixed_vars;
    const cSettings = config.settings;


    const xParams = {};
    const xVars = {};
    const xQueries = [];

    const xConfig = {
        params: xParams,
        vars: xVars,
        queries: xQueries,
    }

    // --PARAMS--
    cSettings.map((setting, si) => {
        // add to variable declaration
        xParams["s" + si] = {type: setting.type};
    })


    // --FIXED VARS--
    expandFixedVars(cFixedVars, xVars);


    // --PROPS--
    // add queries for prop value filling
    expandProps(cProps, xVars, xQueries);

    // --GROUPS--
    expandGroups({
        cGroups: cGroups,
        cProps: cProps,
        xParams: xParams,
        xVars: xVars,
        xQueries: xQueries,
    })

    xConfig.hash = "i_f_"+hash({
        params: xParams,
        vars: xVars,
        queries: xQueries
    })

    return xConfig;
}

module.exports = {
    defaultValues: defaultValues,

    isVar: isVar,
    toVar: toVar,

    expandFilter: expandFilter,
    expandPropFilter: expandPropFilter,
    includeGroupValues: includeGroupValues,

    expandFixedVars: expandFixedVars,
    expandProps: expandProps,
    expandGroups: expandGroups,
    expand: expand,
}
