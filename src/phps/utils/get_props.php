<?php

function get_props(){

    $selection_data_sql = <<<EOF
        SELECT *
        FROM get_props (
EOF;
    $selection_data_sql .= 'p_ids:=ARRAY['.implode(",", $result["grp"]["selection"]).']';

    // identities

    $selection_data_sql .= $entity_groups["selection"]["id"][0] == 1 ? ',p_get_labels:=TRUE' : "";
    $selection_data_sql .= $entity_groups["selection"]["id"][1] == 1 ? ',p_get_aliases:=TRUE' : "";
    $selection_data_sql .= $entity_groups["selection"]["id"][2] == 1 ? ',p_get_descriptions:=TRUE' : "";
    $selection_data_sql .= $entity_groups["selection"]["id"][2] == 1 ? ',p_get_classes:=TRUE' : "";

    $selection_data_sql .= $entity_groups["lang"] != "en" ? ',p_language:='.$entity_groups["lang"] : "";

    // props
    //      create arrays of each type of props


    //      then add them

    $selection_data_sql .= ');';
}
?>
