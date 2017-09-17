<?php
function to_pgsql_datetime($datetime){
    return "TIMESTAMP '".$datetime."'";
}

// function get_by_time($props, $datetimes, $start_datetime, $end_datetime){
function get_by_time($props, $datetimes){

    $props_string = implode(',', $props);

    $sql_part =<<<EOF
INNER JOIN
    ON datetimes.claim_id = 'c:' || claims.id
    WHERE
        claims.property_id = ANY ($props_string)
        AND

EOF;
        if(!is_null($datetimes)){

            $datetime_strings = [];
            foreach ($datetimes as $datetime)
                $datetime_strings[] = to_pgsql_datetime($datetime);

            $sql_part .= 'datetimes.datetime = ANY (ARRAY['.implode(",", $datetime_strings).'])';
        }
        // else
        //     $sql_part .= 'datetimes.datetime BETWEEN '.$start_datetime.' AND '.$end_datetime;


    return $sql_part;
}
?>
