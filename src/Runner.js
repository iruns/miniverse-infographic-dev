/*
This holds scripts that will be called by an infographic project
*/

// import * as expander from "./DataSetConfigExpander";
var expander = require ("./DataSetConfigExpander");

var dataSetConfig = {
    settings: [
        {type: "id_array"},
        {type: "bool"},
        {type: "id_array"},
        {type: "small_int"},
    ],
    fixed_vars: [
        {
            type: "id_array",
            val: [
                "Q1",
                "Q2"
            ]
        },
    ],
    props: [
        {
            prop_type: "entity_ref",
            id: ["P12"]
        },
        {
            prop_type: "datetime",
            id: ["P22"],
        },
    ],
    groups: [
        {
            // filter
            where: { id: ["=s0"] },

            if: "=s1",


            get: {
                // identity
                identities:{
                    "label": {},
                    "alias": {if: "=s1"}
                },
                // props
                props: {
                    "p0": {
                        if: "=s1",
                        get: {
                            qualifiers: {
                                "p1": {if: "=s1"}
                            },
                            references: {
                                "p1": {}
                            },
                        },
                    }
                },
            },

            orderings: [
                { order_by: "=p1", order: "DESC"},
                { order_by: "=p0"},
            ],
            limit: 100,
            offset: "=s3"
        },
        {
            // filter
            where: {
                "p0": {
                    is: ["=g0_p0"],

                    where: {
                        qualifiers: {
                            "p1": {
                                is: ["=g0_p0_q_e_p0"]
                            }
                        },
                        references: {
                            "p1": {
                                is: ["=g0_p0_r_p1"]
                            }
                        },
                    }
                },
            },


            get: {
                identities:{},
                props: {},
            },
        },
        {
            // filter
            where: {
                class: ["=s2"]
            },

            get: {
                identities:{},
                props: {},
            },
        },
        {
            // filter
            where: {
                connected: {
                    to: ["=g0"],

                    up_props: ["=p0"],
                    down_props: ["=p0"],

                    up_depth: 1,
                    down_depth: 2,
                    cousin_depth: 1
                }
            },

            get: {
                identities:{},
                props: {},
            },
        },
    ],
    names: {
        settings: [],
        fixed_vars: [],
        groups: [
            "selection"
        ],
        props: [
            "conservation_status",
            "point_in_time",
        ],
    }
}

var expandedConfig = expander.expand(dataSetConfig);
console.log(expandedConfig);
