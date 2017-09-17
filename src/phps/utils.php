<?php

function process_ids_param($ids){
    if(gettype($ids === "array")){
        $ids = json_encode($ids);
    }
    return str_replace('"', '', $ids);
}

function process_props_result($pg_res){
    $dataset = [];
    $crnt_id = NULL;
    $crnt_table = NULL;
    $crnt_prop = NULL;

    // reformat table to JSON object
    while($row = pg_fetch_row($pg_res)){
        if($row[0] != $crnt_id){
            $crnt_id = $row[0];
            $dataset[$crnt_id] = [];
        }
        if($row[1] != $crnt_table){
            $crnt_table = $row[1];
            $dataset[$crnt_id][$crnt_table] = [];
        }
        // if there's a sub (language or site), insert inside the sub
        if($row[2] != NULL){
            if($row[2] != $crnt_prop){
                $crnt_prop = $row[2];
                $dataset[$crnt_id][$crnt_table][$crnt_prop] = [];
            }
            $dataset[$crnt_id][$crnt_table][$crnt_prop][] = $row[4];
        }
        // otherwise simply insert in prev array
        else{
            $dataset[$crnt_id][$crnt_table][] = $row[4];
        }
    }

    return $dataset;
}

?>
