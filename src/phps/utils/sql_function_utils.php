<?php
require_once __DIR__.'/../connect_to_database.php';


// check whether a particular function for a particular infographic exists
// returns 0-4
// 0 if NO same infographic, version, AND function found
// 1 if NO same infographic found, BUT same function found
// 2 if same infographic and version found, BUT NO same function found
// 3 if same infographic, version, AND function found
function check_infographic_function($infographic, $version, $function_name){
    $pg_res = pg_query("SELECT * FROM check_infographic_function('{$infographic}', '{$version}', '{$function_name}')");
    return pg_fetch_row($pg_res)[0];
}

// creates new pgsql function from an infographic config
function create_infographic_function($function_name, $paramTypes, $groups, $queries){

        // open
        $function_sql = "CREATE FUNCTION ".$function_name." (";
        $function_sql = "p_lang labels.language%TYPE = 'en',p_site sitelinks.site%TYPE = 'enwiki',";

        // insert parameters here
        $params = [];
        foreach ($paramTypes as $param_name => $param_type) {

            $type_text = "";

            switch ($param_type) {
                case 'ids':
                    $type_text = "BIGINT[]";
                    break;

                case 'bool':
                    $type_text = "BOOLEAN";
                    break;

                case 'int':
                    $type_text = "INTEGER";
                    break;

                default:
                    break;
            }

            $params[] = "pm{$param_name} {$type_text}";
        }
        $function_sql .= join(",", $params);

        // declare return and variables
        $function_sql .= ")RETURNS SETOF data_set AS $$ DECLARE ";
        $function_sql .= "ds data_set%ROWTYPE;row RECORD;entity_id BIGINT;claims VARCHAR(127)[];";

        //      add group variables
        for ($i=0; $i < count($groups); $i++) {
            $function_sql .= "gr{$i} BIGINT[] = ARRAY[]::BIGINT[];";
        }

        // begin function
        $function_sql .= " BEGIN ";

        // get identites and properties of selection
        $function_sql .= "gr0 := pm0;";
        $function_sql .= generate_get_props_of_group(0, $groups);

        // run other queries
        for ($i=1; $i < count($queries); $i++) {
            $function_sql .= generate_get_entities($queries[$i]);
        }

        // get others' identites and properties
        for ($i=1; $i < count($groups); $i++) {
            $function_sql .= generate_get_props_of_group($i, $groups);
        }

        // close
        $function_sql .= "RETURN;END; $$ LANGUAGE 'plpgsql';";

        return $function_sql;
}


// combine id arrays in values to pgsql script string
function ids_to_array_string($ids_array){

    $ints = [];
    $parts = [];

    foreach ($ids_array as $ids) {

        switch (gettype($ids)) {
            // if param, add directly to parts
            case 'array':
                $parts[] = "pm".$ids["param"];
                break;

            // if NOT a param, add to ints
            case 'string':
                $ints[] = $ids;
                break;

            default:
                # code...
                break;
        }
    }

    if(count($ints) > 0)
        $parts[] = "ARRAY[".join(",", $ints)."]::BIGINT[]";

    return join("||", $parts);
}

// combine props array in values to pgsql script string
function props_to_array_string($props_array){

    // if the type is string
    if(gettype($props_array) == "string"){
        // if empty, return null
        if(strlen($props_array) == 0)
            return null;
        // else, convert to array
        $props_array = [$props_array];
    }

    $ints = [];
    $parts = [];

    foreach ($props_array as $prop) {

        switch (gettype($prop)) {
            // if param, add directly to parts
            case 'array':
                $parts[] = "pm".$prop["param"];
                break;

            // if NOT a param, add to ints
            case 'string':
                $ints[] = $prop;
                break;

            default:
                # code...
                break;
        }
    }

    if(count($ints) > 0)
        $parts[] = "ARRAY[".join(",", $ints)."]::BIGINT[]";

    if(count($parts) > 0)
        return join("||", $parts);

    return null;
}

// generate pgsql script to get entities
function generate_get_entities($query){

    $get_entities_sql = "";

    $active = true;

    if(array_key_exists("active", $query)){
        switch ($query["active"]) {
            case 'true':
                $active = true;
                break;
            case 'false':
                $active = false;
                break;

            default:
                $active = substr($query["active"], 1);
                break;
        }
    }

    // if NOT active, return empty
    if($active == false)
        return "";
    // else if param, add conditional
    // NOTE no syntax ":" checking
    else if(gettype($active) == "string")
        $get_entities_sql .= "IF ({$active}) THEN ";

    $group = "gr".$query["group"];
    $get_entities_sql .= "{$group}:=ARRAY_CAT({$group},";


    switch ($query["type"]) {
        case 'class':
            $get_entities_sql .= "get_instances_of(".ids_to_array_string($query["classes"])."));";
            break;

        case 'recursive':
            $get_entities_sql .= "get_connected_entities(";

            $get_entities_sql .= "gr0,";//echo var_dump($query);

            $get_entities_sql .= props_to_array_string($query["upProps"]).",";

            $down_props = props_to_array_string($query["downProps"]);
            if(isset($down_props))
                $get_entities_sql .= $down_props.",";

            $get_entities_sql .= "p_up_depth:=".$query["upDepth"].",";
            $get_entities_sql .= "p_down_depth:=".$query["downDepth"].",";
            $get_entities_sql .= "p_cousin_depth:=".$query["cousinDepth"];

            $get_entities_sql .= "));";
            break;

        default:
            # code...
            break;
    }

    // generate pgsql script to convert var containing ids of a group to a dataset table
    $get_entities_sql .= "FOREACH entity_id IN ARRAY {$group} LOOP ";
    $get_entities_sql .= "ds.type := 'g';";
    $get_entities_sql .= "ds.subject := '{$query["group"]}';";
    $get_entities_sql .= "ds.val := entity_id;";
    $get_entities_sql .= "ds.prop := null;ds.spec1 := null;ds.spec2 := null;ds.rank := null;";
    $get_entities_sql .= "RETURN NEXT ds;END LOOP;";

    // if "active" is param, close conditional
    if(gettype($active) == "string")
        $get_entities_sql .= "END IF;";

    return $get_entities_sql;
}

// generate pgsql script to get identities and props of a group
function generate_get_props_of_group($prop_query){

    $get_props_sql = "IF (ARRAY_LENGTH(gr{$idx}, 1) > 0) THEN ";
    $get_props_sql .= "CREATE TEMP TABLE temp AS (SELECT * ";
    $get_props_sql .= "FROM get_values(gr{$idx},";

    $params = [];

    // ids
    if(array_key_exists("identities", $prop_query)){

        foreach ($prop_query["identities"] as $value) {

            switch (gettype($value)) {
                // if param, add directly to parts
                case 'array':
                    $params[] = "pm".$value["param"];
                    break;

                // if NOT a param, add to ints
                case 'string':
                    if($value == "1")
                        $params[] = "TRUE";
                    else if($value == "0")
                        $params[] = "FALSE";
                    break;

                default:
                    # code...
                    break;
            }
        }
        $params[] = "p_lang";
        $params[] = "p_site";
    }

    // props

    $detail_string = "";

    if($props_exist = array_key_exists("props", $prop_query)){

        foreach ($prop_query["props"] as $prop_type => $type_prop_sets) {

            $type_props = [];

            foreach ($type_prop_sets as $type_prop_set){

                // add numbers and parameters either directly or in array.prop, to the array that will be converted to string
                switch (gettype($type_prop_set)) {

                    case 'string':
                        $type_props[] = $type_prop_set;
                        break;

                    // if array, check for qualifiers or references
                    case 'array':

                        if(gettype($type_prop_set["prop"]) == 'array')
                            $type_props = array_merge($type_props, $type_prop_set["prop"]);
                        else
                            $type_props[] = $type_prop_set["prop"];

                        $prop_ids_string = props_to_array_string($type_prop_set["prop"]);

                        $get_details = array(
                            "qualifiers" => array_key_exists("qualifiers", $type_prop_set),
                            "references" => array_key_exists("references", $type_prop_set)
                        );

                        // if any exists, create sql string for qualifiers and references
                        if($get_details["qualifiers"] || $get_details["references"]){


                            // claims
                            $detail_string .= "claims = '{}';FOR row IN SELECT spec1 FROM temp ";
                            $detail_string .= "WHERE prop = ANY({$prop_ids_string}) ";
                            $detail_string .= "LOOP claims := ARRAY_APPEND (claims, row.spec1);END LOOP;";

                            // for each qualifier or reference
                            foreach ($get_details as $detail_type => $get_detail) {

                                if($get_detail){

                                    $detail_params = ["claims"];

                                    $detail_string .= "FOR ds IN SELECT * FROM get_{$detail_type}(";

                                    // for each data type
                                    foreach ($type_prop_set[$detail_type] as $detail_data_type => $data_type_details) {

                                        $detail_array_string = props_to_array_string($data_type_details);
                                        if(isset($detail_array_string))
                                            $detail_params[] = "p_{$detail_data_type}_ids := ". $detail_array_string;
                                    }

                                    $detail_string .= join(",", $detail_params);;
                                    $detail_string .= ")LOOP RETURN NEXT ds; END LOOP;";
                                }
                            }
                        }

                    break;
                }

            }

            $array_string = props_to_array_string($type_props);
            if(isset($array_string))
                $params[] = "p_".$prop_type."_ids := ".$array_string;
        }
    }

    $get_props_sql .= join(",", $params);
    $get_props_sql .= "));FOR ds IN SELECT * FROM temp LOOP RETURN NEXT ds; END LOOP;";

    // add the created detail (qualifiers and references) string
    $get_props_sql .= $detail_string;

    // drop temp table
    $get_props_sql .= "DROP TABLE temp; END IF;";

    return $get_props_sql;
}


// updates (adds new or replaces existing) a function for a particular infographic version
function update_infographic_function($infographic, $version, $function_name){
//     $pg_res = pg_query(<<<EOF
//         SELECT *
//         FROM check_infographic_function(
//             '{$infographic}', '{$version}', '{$function_name}'
//         )
// EOF
//     );
//     return pg_fetch_row($pg_res)[0];
}
?>
