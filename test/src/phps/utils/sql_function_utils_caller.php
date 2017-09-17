<?php
require __DIR__.'/../../../../server/phps/utils/sql_function_utils.php';

$function = isset($_GET["function"]) ? $_GET["function"] : false;
if($function != false){
    switch ($function) {
        case 'check_infographic_function':
            echo check_infographic_function(
                isset($_GET["infographic"]) ? $_GET["infographic"] : "",
                isset($_GET["version"]) ? $_GET["version"] : "0.0",
                isset($_GET["function_name"]) ? $_GET["function_name"] : ""
            );
            break;

        case 'create_infographic_function':
            echo create_infographic_function(
                isset($_GET["function_name"]) ? $_GET["function_name"] : "",
                isset($_GET["paramTypes"]) ? $_GET["paramTypes"] : [],
                isset($_GET["lang"]) ? $_GET["lang"] : "en",
                isset($_GET["site"]) ? $_GET["site"] : "enwiki",
                isset($_GET["groups"]) ? $_GET["groups"] : [],
                isset($_GET["queries"]) ? $_GET["queries"] : []
            );
            break;

        case 'ids_to_array_string':
            echo ids_to_array_string(
                isset($_GET["ids_array"]) ? $_GET["ids_array"] : []
            );
            break;

        case 'props_to_array_string':
            echo props_to_array_string(
                isset($_GET["props_array"]) ? $_GET["props_array"] : []
            );
            break;

        case 'generate_get_entities':
            echo generate_get_entities(
                isset($_GET["query"]) ? $_GET["query"] : []
            );
            break;

        case 'generate_get_props_of_group':
            echo generate_get_props_of_group(
                isset($_GET["prop_query"]) ? $_GET["prop_query"] : []
            );
            break;

        default:
            # code...
            break;
    }
}

?>
