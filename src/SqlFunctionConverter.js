/*
This converts an expanded dataSetConfig to pgSqlFunction to be saved on the database as a function,
so it can then be called by DataSetManager on infographic load and update
*/

import _ from 'lodash';

function addLines(){

    let string = "";

    for (var i = 0; i < arguments.length; i++) {

        const line = arguments[i];

        if(typeof line == "number")
            string += tab(line);

        if(typeof line == "string")
            string += line+"\n";
    }

    return string;
}

function tab(n){
    n = (n==undefined)?1:n;
    let tabs = "";
    for (var i = 0; i < n; i++) {
        tabs += "    ";
    }
    return tabs;
}

function convertVar(varDetails, varName){

    let sqlDataType = "";

    // add variable type
    if(_.startsWith(varDetails.type, "id"))
        sqlDataType = "BIGINT";
    else if(_.startsWith(varDetails.type, "bool"))
        sqlDataType = "BOOLEAN";

    else if(_.startsWith(varDetails.type, "int"))
        sqlDataType = "INT";
    else if(_.startsWith(varDetails.type, "small_int"))
        sqlDataType = "SMALLINT";
    else if(_.startsWith(varDetails.type, "big_int"))
        sqlDataType = "BIGINT";


    else if(_.startsWith(varDetails.type, "string255"))
        sqlDataType = "VARCHAR(255)";
    else if(_.startsWith(varDetails.type, "string127"))
        sqlDataType = "VARCHAR(127)";


    else if(_.startsWith(varDetails.type, "globe_coords"))
        sqlDataType = "POINT";

    else if(_.startsWith(varDetails.type, "quantity"))
        sqlDataType = "NUMERIC";

    return sqlDataType;
}

function convertVars(varDetailss, devider){

    let sqlVars = [];

    _.forEach(varDetailss, (varDetails, varName) => {

        let sqlDataType = convertVar(varDetails, varName);

        const isArray = _.endsWith(varDetails.type, '_array');
        if(isArray)
            sqlDataType += "[]";

        let defValue = "";

        // add default value
        //      if supplied
        if(varDetails.val != undefined){

            // convert single value to array to simplify conversion
            if(!isArray)
                varDetails.val = [varDetails.val];

            // convert values to the correct format
            if(_.startsWith(varDetails.type, "string"))
                varDetails.val = varDetails.val.map(val => "'" + val + "'");

            else if(_.startsWith(varDetails.type, "datetime"))
                varDetails.val = varDetails.val.map(val => `DATE '${val.getFullYear()}-${val.getMonth()}-${val.getDate()}'`);

            else if(_.startsWith(varDetails.type, "globe_coords"))
                varDetails.val = varDetails.val.map(val => "'(" + val.long + "," + val.lat + ")'");


            // convert to string, according to single or array
            if(isArray)
                defValue = " = ARRAY[" + varDetails.val.join(',') + "]::" + sqlDataType;
            else
                defValue = " = "+varDetails.val;

        }
        //      else
        else{
            defValue = " = ";

            if(isArray)
                defValue += "ARRAY[]::" + sqlDataType;

            else if(_.startsWith(varDetails.type, "string"))
                defValue += "''";

            else if(_.startsWith(varDetails.type, "bool"))
                defValue += "FALSE";

            else if(
                _.startsWith(varDetails.type, "int") ||
                _.startsWith(varDetails.type, "small_int") ||
                _.startsWith(varDetails.type, "big_int") ||
                _.startsWith(varDetails.type, "quantity")
            )
                defValue += "0";

            else if(_.startsWith(varDetails.type, "datetime"))
                defValue += "date '0001-1-1'";

            else if(_.startsWith(varDetails.type, "globe_coords"))
                defValue += "'(0,0)'";
        }

        sqlVars.push(tab()+varName + " " + sqlDataType + defValue);
    })

    // join with comma
    return sqlVars.join(devider + "\n");
}

function convertArray(array){
    let ids = [];
    let members = [];

    array.map(member => {
        if(_.isArray(member))
            ids = ids.concat(member);
        else {
            members.push(member);
        }
    })

    if(ids.length > 0)
        members.push(`ARRAY[${ids.join()}]::BIGINT[]`);

    return members.length > 0 ? members.join("||") : "NULL";
}



function convertSetQuery(query){

    let sqlQuery = "";
    let nTabs = 1;

    if(query.if != undefined){
        sqlQuery += tab(nTabs)+`IF ${query.if} THEN\n`;
        nTabs++;
    }

    sqlQuery += tab(nTabs)+`${query.set} = `;

    if(!_.isArray(query.to))
        sqlQuery += `${query.to}`;

    else {
        if(
            query.to.length > 0 &&
            _.isArray(query.to[0])
        )
            query.to[0] = "ARRAY["+query.to[0].join()+"]";

        sqlQuery += query.to.join("||");
     }

     sqlQuery += ";\n";

    if(query.if != undefined)
        sqlQuery += tab(1)+"END IF;\n\n";

    return sqlQuery;
}

function convertClaimQuery({query, vars, nTabs}){

    if(nTabs == undefined)
        nTabs = 1;

    let sqlQuery = "";

    let groupName = "g"+query.group;
    let tableName = "temp_table";
    let functionName = "get_values";
    let propsHolder = "props";
    let params = [];

    // add "if"
    if(query.if != undefined){
        sqlQuery += addLines(
            nTabs, `IF ${query.if}`,
            nTabs, `THEN`,
        );
        nTabs++;
    }

    // set vars according to type
    //      if claim
    if (query.type == "claim"){

        params.push("g"+query.group);

        // if identities is not declared, declare all as false
        if(_.isNil (query.identities))
            params.push("false","false","false","false","false");

        // else, convert
        else {
            params.push(
                query.identities.label,
                query.identities.alias,
                query.identities.description,
                query.identities.sitelink,
                query.identities.class,
            );
        }

        // add lang and site
        params.push("p_lang", "p_site");

        // start claim query
        sqlQuery += addLines(
            nTabs, `IF (ARRAY_LENGTH(${groupName}, 1) > 0)`,
            nTabs, `THEN`,
        );
        nTabs++;

        // exclude existing group members
        sqlQuery += addLines(
            nTabs, `g${query.group} = exclude_ids(g${query.group}, sg${query.group}e);`,
            ""
        );
    }
    //      else if qualifier or reference
    else {
        groupName = "claims";
        tableName += "_sub";
        functionName = `get_${query.type}s`;
        propsHolder = query.type + "s";

        params.push("claims");
    }

    // if qualifier or reference, get claims
    if (query.type != "claim"){
        sqlQuery += addLines(
            nTabs, "claims = '{}';",
            nTabs, "FOR row IN",
            nTabs+1, "SELECT spec1",
            nTabs+1, "FROM temp_table",
            nTabs+1, `WHERE prop = ANY(${query.prop})`,
            nTabs, "LOOP",
            nTabs+1, "claims := ARRAY_APPEND (claims, row.spec1);",
            nTabs, "END LOOP;",
            ""
        )
    }



    // start the value query
    sqlQuery += addLines(
        nTabs, `IF (ARRAY_LENGTH(${groupName}, 1) > 0)`,
        nTabs, `THEN`,
    )
    nTabs++;

    // if there are no subs, simply save to dataSet
    if(query.subs == undefined)
        sqlQuery += addLines(nTabs, "FOR ds IN");
    // else, create temp table
    else
        sqlQuery += addLines(nTabs, `CREATE TEMP TABLE ${tableName} AS (`);

    nTabs++;

    sqlQuery += addLines(
        nTabs, `SELECT *`,
        nTabs, `FROM ${functionName} (`,
    );



    // convert props
    if(!_.isNil (query[propsHolder])){
        _.forEach(query[propsHolder], (props, propType) => {
            params.push("\n"+tab(nTabs+1)+"p_" + propType + "_ids := " + convertArray(props));
        })
    }
    sqlQuery += addLines(
        nTabs+1, params.join(),
        nTabs, ")",
    )

    nTabs--;

    // if there are no subs, simply save to dataSet
    if(_.isNil (query.subs))
        sqlQuery += addLines(
            nTabs, "LOOP RETURN NEXT ds;",
            nTabs, "END LOOP;",
            ""
        );



    // else, close temp table and run the subs
    else {

        sqlQuery += addLines(
            nTabs, ");",
            "",
            nTabs, "FOR ds IN",
            nTabs+1, "SELECT *",
            nTabs+1, `FROM ${tableName}`,
            nTabs, "LOOP RETURN NEXT ds;",
            nTabs, "END LOOP;",
            ""
        );

        query.subs.map(sub => {

            // if saving claims
            if (sub.type == "value_var") {

                    sqlQuery += addLines(nTabs, "FOR row IN");
                    sqlQuery += tab(nTabs+1)+"SELECT ";

                    // add the selected columns
                    //      if single var
                    if (sub.var != undefined)
                        sqlQuery += "val\n";
                    //      else
                    else (sub.vars != undefined)
                        sqlQuery += _.keys(sub.vars).join()+"\n";

                    sqlQuery += addLines(
                        nTabs+1, `FROM ${tableName}`,
                        nTabs+1, `WHERE prop = ANY(${sub.prop})`,
                        nTabs, `LOOP`,
                    );

                    // add appends
                    _.forEach(sub.vars, (varName, column) => {
                        sqlQuery += addLines(
                            nTabs+1, `${varName} := ARRAY_APPEND (${varName},row.${column}::${convertVar(vars[varName], varName)});`
                        )
                    });

                    sqlQuery += addLines(
                        nTabs, `END LOOP;`,
                        ""
                    )
            }

            // else if getting qualifier or references
            else
                sqlQuery += convertClaimQuery({
                    query: sub,
                    vars: vars,
                    nTabs: nTabs
                });
        })

        sqlQuery += addLines(
            nTabs, `DROP TABLE ${tableName};`,
        )
    }

    nTabs--;
    sqlQuery += tab(nTabs)+"END IF;\n\n";

    // close if
    if(query.if != undefined){
        nTabs--;
        sqlQuery += addLines(
            nTabs, `END IF;`,
            ""
        )
    }

    // if claim, end claim query
    if (query.type == "claim"){
        nTabs--;
        sqlQuery += addLines(
            nTabs, `END IF;`,
            ""
        )
    }

    return sqlQuery;
}

function convertGroupDataSet(groupNum){
    return addLines(
        1, `FOREACH e_id IN ARRAY g${groupNum}`,
        1, `LOOP`,
        2, `ds.type := 'g';`,
        2, `ds.subject := ${groupNum};`,
        2, `ds.val := e_id;`,
        2, `ds.prop := 0;`,
        2, `ds.spec1 := '';`,
        2, `ds.spec2 := '';`,
        2, `ds.rank := 0;`,
        1, `RETURN NEXT ds;`,
        1, `END LOOP;`,
        ""
    )
}



function convertClassFilterQuery(query){

    // get the instances of a class to a group
    let sqlQuery = addLines(
        1, `g${query.group} := ARRAY_CAT(`,
        2, `g${query.group},get_instances_of(`,
        3, `${convertArray(query.class)},`,
        3, `${query.limit}::SMALLINT`,
        2, `)`,
        1, `);`,
    )

    // then add to the final dataSet
    sqlQuery += convertGroupDataSet(query.group);

    return sqlQuery;
}

function convertConnectedToFilterQuery(query){

    let sqlQuery = addLines(
        1, `g${query.group} := ARRAY_CAT(`,
        2, `g${query.group},get_connected_entities(`,
        3, `${convertArray(query.entities)},`,
        3, `${convertArray(query.up_props)},`,
    )

    // if provided, add down connector
    if(!_.isNil(query.down_props) && query.down_props.length > 0)
        sqlQuery += addLines(
            3, `${convertArray(query.down_props)},`
        )

    // add the rest
    sqlQuery += addLines(
        3, `p_up_depth := ${query.up_depth}::SMALLINT,`,
        3, `p_down_depth := ${query.down_depth}::SMALLINT,`,
        3, `p_cousin_depth := ${query.cousin_depth}::SMALLINT,`,
        3, `p_limit := ${query.limit}::SMALLINT`,
        2, `)`,
        1, `);`,
    )

    // then add to the final dataSet
    sqlQuery += convertGroupDataSet(query.group);

    return sqlQuery;
}

function convertSubQueryToWhere(sub, post, nTabs){

    if(nTabs == undefined)
        nTabs = 1;

    let sqlQuery = "";

    // simulate if
    if(sub.if != undefined)
        sqlQuery += addLines(
            nTabs, `${sub.if} IS FALSE OR`,
            nTabs, `(`,
        )

    // add prop
    sqlQuery += addLines(
        nTabs, `c${post}.property_id = ANY (${sub.prop})`,
    )

    // add each value type
    //      if a simple equal to many values
    _.forEach(sub.exacts, (values, column) => {

        sqlQuery += addLines(
            nTabs, `AND`,
            nTabs, `v${post}.${column} = ANY (${convertArray(values)})`,
        )
    })

    //      else if with range around points
    _.forEach(sub.ranges, (range, column) => {
        if(column == "amount"){
            sqlQuery += addLines(
                nTabs, `AND`,
                nTabs, `v${post}.${column}`,
            )
        }
        else if(column == "datetime"){
            sqlQuery += addLines(
                nTabs, `AND`,
                nTabs, `(v${post}.datetime::DATE - date '0001-1-1') - (v${post}.bce_years * 365.2422)::INT`,
            )
        }
        sqlQuery += addLines(
            nTabs+1, `BETWEEN min_n(${range.points})-${range.lower_range}`,
            nTabs+1, `AND max_n(${range.points})+${range.upper_range}`,
        )
    })

    // simulate if
    if(sub.if != undefined)
        sqlQuery += `\n)\n`;

    return sqlQuery;
}

function convertPropsFilterQuery(query){

    const firstProp = query.subs[0].prop;
    let nTabs = 1;

    // add beginning
    let sqlQuery = tab(nTabs)+`FOR row IN\n`;
    nTabs++;

    sqlQuery += addLines(
        nTabs, `SELECT DISTINCT ON (entity_id)`,
        nTabs, `c_${firstProp}.entity_id`,

        nTabs, `FROM claims as c_${firstProp}`,
    )

    // add the subs
    //      add joins
    query.subs.map((sub, idx) => {

        // add join on claims (if not first)
        if(idx > 0){
            sqlQuery += addLines(
                "",
                nTabs, `INNER JOIN claims as c_${sub.prop}`,
                nTabs, `ON`,
                nTabs, `c_${sub.prop}.entity_id = c_${firstProp}.entity_id`,
            )
        }

        // add join on value table
        sqlQuery += addLines(
            "",
            nTabs, `INNER JOIN ${sub.table} as v_${sub.prop}`,
            nTabs, `ON`,
            nTabs, `v_${sub.prop}.claim_id = 'c:' || c_${sub.prop}.id`,
        )

        // add qualifiers and references
        if(sub.subs != undefined){
            sub.subs.map((detail, detailIdx) => {

                let detailPost = "_"+sub.prop;

                if(detail.detail_table == "claim_qualifiers")
                    detailPost += "_q";

                detailPost += "_"+detail.claim_prefix+"_"+detail.prop;


                // add join on claims
                sqlQuery += addLines(
                    "",
                    nTabs, `INNER JOIN ${detail.detail_table} as c${detailPost}`,
                    nTabs, `ON`,
                    nTabs, `c${detailPost}.claim_id = 'c:' || v_${sub.prop}.claim_id`,
                )

                // add join on value table
                sqlQuery += addLines(
                    "",
                    nTabs, `INNER JOIN ${detail.table} as v${detailPost}`,
                    nTabs, `ON`,
                    nTabs, `SUBSTRING(v${detailPost}.claim_id FROM '${detail.claim_prefix}.*:(.*)') = c${detailPost}.claim_id`,
                )
            })
        }
    })

    //      add wheres
    sqlQuery += addLines(nTabs, "WHERE");
    nTabs++;

    query.subs.map((sub, idx) => {

        if(idx > 0)
            sqlQuery += addLines(nTabs, "AND");

        sqlQuery += convertSubQueryToWhere(sub, "_" + sub.prop, nTabs);

        // add qualifiers and references
        if(sub.subs != undefined){
            sub.subs.map((detail, detailIdx) => {

                let detailPost = "_"+sub.prop;

                if(detail.detail_table == "claim_qualifiers")
                    detailPost += "_q";

                detailPost += "_"+detail.claim_prefix+"_"+detail.prop;

                sqlQuery += addLines(nTabs, "AND")

                sqlQuery += convertSubQueryToWhere(detail, detailPost, nTabs);
            })
        }
    })

    nTabs--;

    // add limit
    sqlQuery += addLines(nTabs, `LIMIT ${query.limit}`);

    // add offset
    if(query.offset != undefined)
        sqlQuery += addLines(nTabs, `OFFSET ${query.offset}`);

    // add order by
    if(query.orderings != undefined){
        sqlQuery += addLines(nTabs, `ORDER BY`);

        const orderings = [];
        query.orderings.map(ordering => {
            orderings.push(ordering.order_by + ".v " + ordering.order);
        })

        sqlQuery += addLines(nTabs, orderings.join(",")+";");
    }

    nTabs--

    // and group loop
    sqlQuery += addLines(
        nTabs, `LOOP`,
        nTabs+1, `g${query.group} := ARRAY_APPEND (g${query.group}, row.entity_id);`,
        nTabs, `END LOOP;`,
        ""
    )

    // then add to the final dataSet
    sqlQuery += convertGroupDataSet(query.group);

    return sqlQuery;
}


function createFunction(config){

    // open
    let sqlQuery = `CREATE FUNCTION ${config.hash} (\n`;

    // params
    //      standard params
    sqlQuery += addLines(
        1, `p_lang labels.language%TYPE = 'en',`,
        1, `p_site sitelinks.site%TYPE = 'enwiki',`,

    //      others
        convertVars(config.params, ","),
        ")",
        "",

    // return
        "RETURNS SETOF data_set AS $$",
        "",

    // variables
        "DECLARE",
    //      standard vars
        1, "ds data_set%ROWTYPE;",
        1, "row RECORD;",
        1, "e_id BIGINT;",
        1, "claims VARCHAR(127)[];",
        //      others
        convertVars(config.vars, ";") + ";",
        "",

        // begin
        "BEGIN",
        "",
    )

    // queries
    config.queries.map(query => {

        switch (query.type) {

            case 'set':
                sqlQuery += convertSetQuery(query);
                break;

            case 'claim':
                sqlQuery += convertClaimQuery({
                    query: query,
                    vars: config.vars
                });
                break;

            case 'class_filter':
                sqlQuery += convertClassFilterQuery(query);
                break;

            case 'connected_to_filter':
                sqlQuery += convertConnectedToFilterQuery(query);
                break;

            case 'props_filter':
                sqlQuery += convertPropsFilterQuery(query);
                break;

            default:

        }

        sqlQuery += "\n";
    })

    // close
    sqlQuery += "RETURN;END;$$ LANGUAGE 'plpgsql';";

    return sqlQuery;
}

module.exports = {
    convertVars: convertVars,
    convertArray: convertArray,

    convertSetQuery: convertSetQuery,
    convertClaimQuery: convertClaimQuery,

    convertClassFilterQuery: convertClassFilterQuery,
    convertConnectedToFilterQuery: convertConnectedToFilterQuery,
    convertPropsFilterQuery: convertPropsFilterQuery,

    createFunction: createFunction,
}
