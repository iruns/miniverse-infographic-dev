import * as expander from '../../src/DataSetConfigExpander';

import _ from 'lodash';

import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from "sinon-chai";

chai.use(sinonChai);

// npm test -- --grep "DataSetConfigExpander"

describe("DataSetConfigExpander", () => {

    describe("expandFilter()", () => {

        // TODO maybe split lone id with id compounded by other filters?
        it("id filter", () => {

            const filterConfig = { _ids: ["s0"] };

            const xPropQueryProps = {};
            expander.expandFilter({
                propQueryProps: xPropQueryProps,
                variable: "g",
                idx: 0,
                filter: filterConfig,
            });

            const expRes = {
                "g0": ["s0"],
            };

            expect(xPropQueryProps).to.deep.equal(expRes);
        })

        // filter settings
        it("filter settings", () => {

            const filterConfig = { _ids: ["s0"] };

            const xPropQueryProps = {};
            expander.expandFilter({
                propQueryProps: xPropQueryProps,
                variable: "g",
                idx: 0,
                filter: filterConfig,
            });

            const expRes = {
                "g0": ["s0"],
            };

            expect(xPropQueryProps).to.deep.equal(expRes);
        })

        it("class filter", () => {

            const filterConfig = { _class: ["v0"] };

            const xQueries = [];
            expander.expandFilter({
                queries: xQueries,
                idx: 0,
                filter: filterConfig,
            });

            const expRes = [
                {
                    type: 'class',

                    group: 0,
                    classes: ["v0"],
                },
            ];

            expect(xQueries).to.deep.equal(expRes);
        })

        it("recursively connected filter", () => {

            const filterConfig = {
                _connected: {
                    _to: ["g0"],

                    _upProps: ["v0"],
                    _downProps: [["P10"]],

                    _upDepth: "s2",
                    _downDepth: "s3",
                    _cousinDepth: 1
                }
            };

            const xQueries = [];
            expander.expandFilter({
                queries: xQueries,
                idx: 1,
                filter: filterConfig,
            });

            const expRes = [
                {
                    type: 'connectedTo',

                    group: 1,

                    entities: ["g0"],

                    upProps: ["v0"],
                    downProps: [[101]],

                    upDepth: "s2",
                    downDepth: "s3",
                    cousinDepth: 1,
                },
            ];

            expect(xQueries).to.deep.equal(expRes);
        })

        // TODO create converter that only selects from a set of ids, thus enabling compound filters
        describe("props filter", () => {

            it("entity_ref", () => {

                const filterConfig = {
                    "p0": { _is: ["g0_p0"]}
                };

                const props = {
                    "p0": {
                        _type: "entity_ref",
                        _ids: ["P123"]
                    }
                }

                const xQueries = [];
                expander.expandFilter({
                    queries: xQueries,
                    props: props,
                    idx: 1,
                    filter: filterConfig,
                });

                const expRes = [
                    {
                        type: 'props',

                        group: 1,

                        subs: [
                            {
                                table: "entity_ref",
                                prop: "p0",

                                exacts: {
                                    value: ["g0_p0"]
                                }
                            },
                        ],
                    },
                ];

                expect(xQueries).to.deep.equal(expRes);
            })

            it("string, globe_coordinates", () => {

                const filterConfig = {
                    "p0": { _is: ["g0_p0"]},
                    "p1": { _is: ["g0_p1"]},
                };

                const props = {
                    "p0": {
                        _type: "string",
                        _ids: ["P123"]
                    },
                    "p1": {
                        _type: "globe_coordinates",
                        _ids: ["P123"]
                    },
                }

                const xQueries = [];
                expander.expandFilter({
                    queries: xQueries,
                    props: props,
                    idx: 1,
                    filter: filterConfig,
                });

                const expRes = [
                    {
                        type: 'props',

                        group: 1,

                        subs: [
                            {
                                table: "string",
                                prop: "p0",

                                exacts: {
                                    value: ["g0_p0_v"],
                                },
                            },
                            {
                                table: "globe_coordinates",
                                prop: "p1",

                                exacts: {
                                    value: ["g0_p1_v"]
                                }
                            },
                        ],
                    },
                ];

                expect(xQueries).to.deep.equal(expRes);
            })

            it("quantity, from var", () => {

                const filterConfig = {
                    "p0": {
                        _amount: [[10.1, 20], "s0"],
                        _unit: ["s1"],
                    },
                    "p1": {
                        _amount: [[10.1, 20], "v0"],
                        _lower_range: 2,
                        _upper_range: "v1",
                        _unit: ["1"],
                    },
                };

                const props = {
                    "p0": {
                        _type: "quantity",
                        _ids: ["P123"]
                    },
                    "p1": {
                        _type: "quantity",
                        _ids: ["P1234"]
                    },
                }

                const xQueries = [];
                // expander.expandFilter({
                //     queries: xQueries,
                //     props: props,
                //     idx: 1,
                //     filter: filterConfig,
                // });

                const expRes = [
                    {
                        type: 'props',

                        group: 1,

                        subs: [
                            {
                                table: "quantity",
                                prop: "p0",

                                exacts: {
                                    unit: ["g0_p0_v4"]
                                },
                                ranges: {
                                    amount:{
                                        type: "quantity",
                                        points: ["g0_p0_v"],

                                        lowerRange: 2,
                                        upperRange: "v_upper_range",
                                    },
                                }
                            },
                            {
                                table: "quantity",
                                prop: "p0",

                                exacts: {
                                    unit: ["g0_p0_v4"]
                                },
                                ranges: {
                                    amount:{
                                        type: "quantity",
                                        points: ["g0_p0_v"],

                                        lowerRange: 2,
                                        upperRange: "v_upper_range",
                                    },
                                }
                            },
                        ],
                    },
                ];

                // expect(xQueries).to.deep.equal(expRes);
            })

            it("quantity, from other group's prop value", () => {

                const filterConfig = {
                    "p0": { _is: ["g0_p0"]},
                    // "country": { _is: "g0_p1"},
                };

                const props = {
                    "p0": {
                        _type: "quantity",
                        _ids: ["P123"]
                    }
                }

                const xQueries = [];
                // expander.expandFilter({
                //     queries: xQueries,
                //     props: props,
                //     idx: 1,
                //     filter: filterConfig,
                // });

                const expRes = [
                    {
                        type: 'props',

                        group: 1,

                        subs: [
                            {
                                table: "entity_ref",
                                prop: "p0",

                                exacts: {
                                    unit: ["g0_p0_v4"]
                                },
                                ranges: {
                                    amount:{
                                        type: "quantity",
                                        points: ["g0_p0_v"],

                                        lowerRange: 2,
                                        upperRange: "v_upper_range",
                                    },
                                }
                            },
                        ],
                    },
                ];

                // expect(xQueries).to.deep.equal(expRes);
            })

            it("datetime", () => {

                const filterConfig = {
                    "p0": { _is: ["g0_p0"]},
                    // "country": { _is: "g0_p1"},
                };

                const props = {
                    "p0": {
                        _type: "entity_ref",
                        _ids: ["P123"]
                    }
                }

                const xQueries = [];
                // expander.expandFilter({
                //     queries: xQueries,
                //     props: props,
                //     idx: 1,
                //     filter: filterConfig,
                // });

                const expRes = [
                    {
                        type: 'props',

                        group: 1,

                        subs: [
                            {
                                table: "entity_ref",
                                prop: "p0",

                                exacts: {
                                    value: ["g0_p0"]
                                }
                            },
                        ],
                    },
                ];

                // expect(xQueries).to.deep.equal(expRes);
            })

            // saving value
        })


        // filter qualifier and references
        // all above + params + vars
        // all above + other group's ids and prop values
    })

    describe("expand()", () => {

        it("selection, identity only", () => {
            const dataSetConfig = {
                _settings: [
                    {_type: "id_array"}
                ],
                _fixed_vars: [],
                _props: [],
                _groups: [
                    {
                        // filter
                        _where: { _ids: ["s0"] },

                        _get: {

                            _identities:{
                                "_label": {},
                                "_alias": {},
                                "_sitelink": {},
                            },
                        },
                    },
                ],
                _lists: {
                    _settings: ["_selection_ids"],
                    _fixed_vars: [],
                    _props: [],
                    _groups: ["selection"]
                }
            };


            const xDataSetConfig = expander.expand(dataSetConfig);

            const expRes = {
                params: {
                    "s0": {// selection
                        type: 'id_array'
                    },
                    "sg0e": {// selection's existing member
                        type: 'id_array'
                    },
                },
                vars: {
                    "g0": {
                        type: 'id_array'
                    },
                },
                queries: [
                    {
                        type: "props",
                        props: {
                            "g0": ["s0"],
                        },
                    },
                    // selection props
                    {
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: true,
                            description: false,
                            sitelink: true,
                            class: false,
                        },
                    },
                ]
            };

            expect(xDataSetConfig).to.deep.equal(expRes);
        })

        it("selection, + props", () => {
            const dataSetConfig = {
                _settings: [
                    {_type: "id_array"}
                ],
                _fixed_vars: [],
                _props: [
                    // conservation_status
                    {
                        _prop_type: "entity_ref",
                        _ids: [["P141"]]
                    },
                    // image
                    {
                        _prop_type: "string",
                        _ids: [["P18"]],
                    },
                ],

                _groups: [
                    {
                        // filter
                        _where: { _ids: ["s0"] },

                        _get: {
                            // identity
                            _identities:{
                                "_label": {},
                                "_alias": {},
                                "_sitelink": {},
                            },
                            // props
                            _props: {
                                "p0": {}, // conservation_status
                                "p1": {} // image
                            }
                        },
                    },
                ],
                _lists: {
                    _settings: ["_selection_ids"],
                    _fixed_vars: [],
                    _props: ["conservation_status", "image"],
                    _groups: ["selection"]
                }
            }

            const xDataSetConfig = expander.expand(dataSetConfig);

            const expRes = {
                params: {
                    "s0": {// selection
                        type: 'id_array'
                    },
                    "sg0e": {// selection's existing member
                        type: 'id_array'
                    },
                },
                vars: {
                    "g0": {
                        type: 'id_array'
                    },
                    "vp0": {
                        type: 'id_array',
                    },
                    "vp1": {
                        type: 'id_array',
                    },
                },
                queries: [
                    // query to fill prop value. separated from the declaration so they can use var as value
                    {
                        type: "props",
                        props: {
                            "g0": ["s0"],
                            "vp0": [[1411]],
                            "vp1": [[181]],
                        }
                    },
                    // selection props
                    {
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: true,
                            description: false,
                            sitelink: true,
                            class: false,
                        },

                        props: {
                            entity_ref: ["vp0"],
                            string: ["vp1"],
                        }
                    },
                ]
            };

            expect(xDataSetConfig).to.deep.equal(expRes);
        })

        it("selection, + props + settings", () => {
            const dataSetConfig = {
                _settings: [
                    {_type: "id_array"},
                    {_type: "bool"},
                    {_type: "bool"},
                    {_type: "id_array"},
                ],
                _fixed_vars: [],
                _props: [
                    // conservation_status
                    {
                        _prop_type: "entity_ref",
                        _ids: [["P141"]]
                    },
                    // image
                    {
                        _prop_type: "string",
                        _ids: [
                            ["P18"],
                            "s3"
                        ],
                    },
                ],
                _groups: [
                    {
                        // filter
                        _where: { _ids: ["s0"] },

                        _get: {
                            // identity
                            _identities:{
                                "_label": {},
                                "_alias": {_active: "s1"},
                                "_sitelink": {},
                            },
                            // props
                            _props: {
                                "p0": {}, // conservation_status
                                "p1": {_active: "s2"} // image
                            }
                        },
                    },
                ],
                _lists: {
                    _settings: [
                        "_selection_ids",
                        "get_aliases",
                        "get_images",
                        "images_props",
                    ],
                    _fixed_vars: [],
                    _groups: [
                        "selection"
                    ],
                    _props: [
                        "conservation_status",
                        "image",
                    ],
                }
            }

            const xDataSetConfig = expander.expand(dataSetConfig);

            const expRes = {
                params: {
                    "s0": {
                        type: 'id_array'
                    },
                    "sg0e": {
                        type: 'id_array'
                    },
                    "s1": {
                        type: "bool"
                    },
                    "s2": {
                        type: "bool"
                    },
                    "s3": {
                        type: "id_array"
                    },
                },
                vars: {
                    "g0": {type: 'id_array'},
                    "vp0": {type: 'id_array'},
                    "vp1": {type: 'id_array'},
                    "vp1_a0": {type: 'id_array'},
                },
                queries: [
                    // query to fill prop value. separated from the declaration so they can use var as value
                    {
                        type: "props",
                        props: {
                            "g0": ["s0"],
                            "vp0": [[1411]],
                            "vp1": ["s3", [181]],
                        }
                    },
                    // query to simulate activating/deactivating prop
                    {
                        type: 'activate',

                        bool: "s2",
                        set: "vp1_a0",
                        to: "vp1"
                    },
                    // selection props
                    {
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: "s1",
                            description: false,
                            sitelink: true,
                            class: false,
                        },
                        // props
                        props: {
                            entity_ref: ["vp0"],
                            string: ["vp1_a0"],
                        }
                    },
                ]
            };

            expect(xDataSetConfig).to.deep.equal(expRes);
        })

        it("selection, + props + settings + vars", () => {
            const dataSetConfig = {
                _settings: [
                    {_type: "id_array"},
                    {_type: "bool"},
                    {_type: "bool"},
                    {_type: "id_array"},
                ],
                _fixed_vars: [
                    // image2
                    {
                        _type: "id_array",
                        _vals: ["s3"]
                    },
                    // conservation_status2
                    {
                        _type: "id_array",
                        _vals: [["P20"]]
                    },
                ],
                _props: [
                    // conservation_status
                    {
                        _prop_type: "entity_ref",
                        _ids: [["P141"]]
                    },
                    // image
                    {
                        _prop_type: "string",
                        _ids: [
                            ["P18"],
                            "v0"
                        ],
                    },
                ],
                _groups: [
                    {
                        // filter
                        _where: { _ids: ["s0", "v1"] },

                        _get: {
                            // identity
                            _identities:{
                                "_label": {},
                                "_alias": {_active: "s1"},
                                "_sitelink": {},
                            },
                            // props
                            _props: {
                                "p0": {}, // conservation_status
                                "p1": {_active: "s2"} // image
                            }
                        },
                    },
                ],
                _lists: {
                    _settings: [
                        "_selection_ids",
                        "get_aliases",
                        "get_images",
                        "images_props",
                    ],
                    _fixed_vars: [
                        "image_props2",
                        "conservation_status2",
                    ],
                    _groups: [
                        "selection"
                    ],
                    _props: [
                        "conservation_status",
                        "image",
                    ],
                }
            }

            const xDataSetConfig = expander.expand(dataSetConfig);

            const expRes = {
                params: {
                    "s0": {
                        type: 'id_array'
                    },
                    "sg0e": {
                        type: 'id_array'
                    },
                    "s1": {
                        type: "bool"
                    },
                    "s2": {
                        type: "bool"
                    },
                    "s3": {
                        type: "id_array"
                    },
                },
                vars: {
                    "g0": {type: 'id_array'},
                    "vp0": {type: 'id_array'},
                    "vp1": {type: 'id_array'},
                    "vp1_a0": {type: 'id_array'},
                    "v0":
                        {
                            type: "id_array",
                            vals: ["s3"]
                        },
                    "v1":
                        {
                            type: "id_array",
                            vals: [[201]]
                        },
                },
                queries: [
                    // query to fill prop value. separated from the declaration so they can use var as value
                    {
                        type: "props",
                        props: {
                            "g0": ["s0", "v1"],
                            "vp0": [[1411]],
                            "vp1": ["v0", [181]],
                        }
                    },
                    // query to simulate activating/deactivating prop
                    {
                        type: 'activate',

                        bool: "s2",
                        set: "vp1_a0",
                        to: "vp1"
                    },
                    // selection props
                    {
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: "s1",
                            description: false,
                            sitelink: true,
                            class: false,
                        },
                        // props
                        props: {
                            entity_ref: ["vp0"],
                            string: ["vp1_a0"],
                        }
                    },
                ]
            };

            expect(xDataSetConfig).to.deep.equal(expRes);
        })


        /*
        selection id "Q123"
        selection label_p label
        selection population_p population
        population_p point_in_time_p 1900-1-1
        population_p point_in_time_p population_time
        */
        let all = {
            vars: {
                "biome": {
                    type: "entity_ref",
                    ids: ["P123"]
                },
                "conservation_status": {
                    type: "entity_ref",
                    ids: ["P141"]
                },
                "image": {
                    type: "string",
                    ids: [
                        "P18",
                        "=_settings.other_image_prop_ids"
                    ],
                },
                "parent_taxon": {
                    type: "entity_ref",
                    ids: ["P171"]
                },
                "start_time": {
                    type: "datetime",
                    ids: ["P123"]
                },
                "taxonomic_rank": {
                    type: "entity_ref",
                    ids: []
                }
            },

            groups: {
                "selection": {
                    // filter
                    filterBy: { id: "=selection" },

                    get: [
                        // identity
                        "_label", "_alias",
                        { the: "_description", isActive: "=_settings.get_description" },

                        // property
                        "conservation_status",
                        "biome",
                        "location",
                        "image",
                        {
                            the: "population",
                            and: [
                                { the: "point_in_time", of: "prop" }
                            ]
                        },
                    ]
                },
                "taxon": {
                    // filter
                    filterBy: {
                        connectedTo: "=selection",

                        upProps: ["parent_taxon"],

                        upDepth: "=_settings.taxonomy.up_depth",
                        downDepth: "=_settings.taxonomy.down_depth",
                        cousinDepth: 1,
                    },
                    get: [
                        // identity
                        "_label",

                        // property
                        "conservation_status",
                        "biome",
                        "location",
                        "image",
                        {
                            the: "population",

                            filterBy: {
                                props: [
                                    { where: "location", of: "prop", is: "=selection.location" },
                                    { where: "point_in_time", of: "prop", is: "=_settings.time", lowerRange: "0000-6-0", },
                                ]
                            },

                            and: [
                                { the: "location", of: "prop" },
                                { the: "point_in_time", of: "prop" },
                            ]
                        },
                    ],
                },

                "rank": {
                    // filter
                    filterBy: {
                        props: [
                            { where: "_class", is: "taxonomic_rank" }
                        ]
                    },
                    get: [
                        // identity
                        "_label"
                    ],
                },
                "location": {
                    // filter
                    filterBy: {id: "=selection.location", isActive: "=_settings.get_location"},
                    get: [
                        // identity
                        "_label",
                        // property
                        "map_color"
                    ],
                },

                "possible_region": {
                    // filter
                    filterBy: {
                        props: [
                            { where: "_class", is: "real" },
                            { where: "biome",

                                filterBy: {
                                    props: [
                                        { where: "source", of: "ref", is: "=_settings.credible_sources" },
                                    ]
                                },

                                is: "=selection.biome",

                                and: [
                                    { where: "end_time", of: "prop", is: null }
                                ],

                                isActive: "=_settings.get_biome",
                            }
                        ],
                        isActive: "=_settings.get_possible_region",
                        orderBy: "biome",
                        order: "ASC",
                        limit: 100
                    },
                    get: [
                        // identity
                        "_label",
                        // props
                        "coords",
                        {
                            the: "biome",

                            filterBy: {
                                props: [
                                    { where: "end_time", of: "prop", is: null },
                                ]
                            }
                        }
                    ]
                },
            }
        }
        // newer version
        all = {
            _props: {
                "biome": {
                    _type: "entity_ref",
                    _ids: ["P123"]
                },
                "conservation_status": {
                    _type: "entity_ref",
                    _ids: ["P141"]
                },
                "image": {
                    _type: "string",
                    _ids: [
                        "P18",
                        "=_settings.other_image_prop_ids"
                    ],
                },
                "parent_taxon": {
                    _type: "entity_ref",
                    _ids: ["P171"]
                },
                "start_time": {
                    _type: "datetime",
                    _ids: ["P123"]
                },
                "taxonomic_rank": {
                    _type: "entity_ref",
                    _ids: []
                }
            },

            _groups: {
                "selection": {
                    // filter
                    _where: { _id: "=_settings.selection" },

                    _get: {
                        // identity
                        "_label": {}, "_alias": {},
                        "_description": { _active: "=_settings.get_description" },
                        "_class": {},

                        // property
                        "conservation_status": {},
                        "biome": {},
                        "location": {},
                        "image": {},
                        "population": {
                            _get: {
                                "point_in_time": { _of: "prop" }
                            }
                        },
                    }
                },
                "taxon": {
                    // filter
                    _where: {
                        _connected: {
                            _to: "=selection",

                            _upProps: ["parent_taxon", "parent_taxon2"],

                            _upDepth: "=_settings.taxonomy.up_depth",
                            _downDepth: "=_settings.taxonomy.down_depth",
                            _cousinDepth: 1
                        },
                    },
                    _get: {
                        // identity
                        "_label": {},

                        // property
                        "conservation_status": {},
                        "biome": {},
                        "location": {},
                        "image": {},
                        "population": {
                            _where: {
                                "location": { _of: "prop", _is: [":selection.location", "=_settings.other_locations"] },
                                "point_in_time": { _of: "prop", _is: "=_settings.time", _lowerRange: "0000-6-0", },
                            },

                            _get: {
                                "location": { _of: "prop" },
                                "point_in_time": { _of: "prop" },
                            }
                        },
                    },
                },

                "rank": {
                    // filter
                    _where: {
                        _class: { _is: "taxonomic_rank" }
                    },
                    _get: {
                        // identity
                        "_label": {}
                    },
                },
                "location": {
                    // filter
                    _where: {
                        _id: "=selection.location",
                        _active: "=_settings.get_location"
                    },
                    _get: {
                        // identity
                        "_label": {},
                        // property
                        "map_color": {}
                    },
                },

                "possible_region": {
                    // filter
                    _where: {
                        _class: ["real"],
                        "biome": { _is: "=selection.biome",

                            _where: {
                                "source": { _of: "ref", _is: "=_settings.credible_sources" },
                                "end_time": { _of: "prop", _is: null }
                            },

                            _active: "=_settings.get_biome",
                        },

                        _active: "=_settings.get_possible_region",
                        _orderBy: "biome",
                        _order: "ASC",
                        _limit: 100,
                        _skip: "=_settings.skip_regions"
                    },
                    _get: {
                        // identity
                        "_label": {},
                        // props
                        "coords": {},
                        "biome": {
                            _where: {
                                "end_time": { _of: "prop", _is: null },
                            }
                        }
                    }
                },
            }
        }
        const rawConfig = `
            _props
                biome
                    _type entity_ref
                    _ids P123

                conservation_status
                    _type entity_ref
                    _ids P141

                image
                    _type string
                    _ids
                        P18
                        =_settings.other_image_prop_ids

                parent_taxon
                    _type entity_ref
                    _ids P171

                start_time
                    _type datetime
                    _ids P123

                taxonomic_rank
                    _type entity_ref
                    _ids =_settings.taxonomic_rank_prop_ids

            _groups
                selection
                    // filter
                    _where
                        _id =_selection_ids

                    _get
                        // identity
                        _label
                        _alias
                        _description
                            _active =_settings.get_description
                        _class

                        // property
                        conservation_status
                        biome
                        location
                        image
                        population
                            _get
                                point_in_time _of prop

                taxon
                    // filter
                    _where
                        _connected
                            _to =selection

                            _upProps
                                parent_taxon
                                parent_taxon2

                            _upDepth =_settings.taxonomy.up_depth
                            _downDepth =_settings.taxonomy.down_depth
                            _cousinDepth 1

                    _get
                        // identity
                        _label

                        // property
                        conservation_status
                        biome
                        location
                        image
                        population
                            _where
                                location
                                    _of prop
                                    _is
                                        =_groups.selection.location
                                        =_settings.other_locations
                                point_in_time
                                    _of prop
                                    _is =_settings.time
                                    _lowerRange 0000-6-0


                            _get
                                location _of prop
                                point_in_time _of prop

                rank
                    // filter
                    _where
                        _class  _is taxonomic_rank

                    _get
                        // identity
                        _label

                location
                    // filter
                    _where
                        _id =_groups.selection.location
                        _active =_settings.get_location

                    _get
                        // identity
                        _label
                        // property
                        map_color

                possible_region
                    // filter
                    _where
                        _class _is real
                        biome _is =_groups.selection.biome

                            _where
                                source _of ref _is =_settings.credible_sources
                                    end_time _of prop _is null

                            _active =_settings.get_biome

                        _active =_settings.get_possible_region
                        _orderBy biome
                        _order ASC
                        _limit 100
                        _skip =_settings.skip_regions

                    _get
                        // identity
                        _label
                        // props
                        coords
                        biome
                            _where
                                end_time _of prop _is null
        `;


        it("all", () => {
            const sqlDataSet = [
                {
                    groups: {
                        "selection": {
                            filters: [
                                {
                                    type: "_id",
                                    vals: [":selection"]
                                }
                            ],
                            props: [
                                // identity
                                "_label",
                                "alias",
                                "sitelink",
                                // props
                                {
                                    prop: "population",
                                    active: "=_settings.get_pop",

                                    filters: [

                                    ]
                                },
                                "conservation_status",
                                "biome",
                                "image"
                            ],
                        },

                        "taxon": {
                            props: [
                                // identity
                                "_label",
                                {"alias": "=_settings.get_alias"},
                                "sitelink",
                                // props
                                "conservation_status",
                                {"image": "=_settings.get_image"}
                            ],
                            queries:[
                                {
                                    active: "=_settings.get_taxonomy",
                                    type: "recursive",

                                    connectedTo: [":selection"],

                                    upProps: ["parent_taxon"],

                                    upDepth: "=_settings.taxonomy.up_depth",
                                    downDepth: "=_settings.taxonomy.down_depth",
                                    cousinDepth: 1,
                                },
                            ]
                        },
                        "biome": {
                            props: [
                                // identity
                                "_label",
                                // props
                                "image"
                            ],
                            queries: [
                                {
                                    active: "=_settings.get_taxonomy",
                                    type: "_id",
                                    vals: [":selection.biome"]
                                }
                            ]
                        },
                        "region": {
                            props: [
                                // identity
                                "_label",
                                // props
                                "image"
                            ],
                            queries: [
                                {
                                    type: 'standard',

                                    limit: "=_settings.max_region",

                                    subs: [
                                        {
                                            dataType: "entity_ref",
                                            props: ["biome"],

                                            exacts: {
                                                value: [":selection.biome"]
                                            },

                                            details:[
                                                {
                                                    detailType: "claim_qualifiers",
                                                    claimPrefix: "q",

                                                    dataType: "entity_ref",
                                                    props: ["v_country_type_prop"],

                                                    exacts:{
                                                        value: ["v_country_type"]
                                                    },
                                                },
                                            ]
                                        },
                                    ],
                                },
                            ]
                        },
                    },

                    props: {
                        "biome": {
                            type: "entity_ref",
                            ids: ["P123"]
                        },
                        "conservation_status": {
                            type: "entity_ref",
                            ids: ["P141"]
                        },
                        "image": {
                            type: "string",
                            ids: [
                                "P18",
                                "=_settings.other_image_prop_ids"
                            ],
                        },
                        "parent_taxon": {
                            type: "entity_ref",
                            ids: ["P171"]
                        },
                        "start_time": {
                            type: "datetime",
                            ids: ["P123"]
                        }
                    },
                },
            ]

            // const dataSet = expander.pack(sqlDataSet);

            const expRes = {
                params: {
                    "g_0": {
                        type: 'id_array',
                        val: [1,2],
                    },
                    // TODO, each group should have "existing" member as parameter
                    "p_get_alias": {
                        type: 'bool',
                        val: true,
                    },
                },
                vars: {
                    "g_1": {type: 'id_array',},
                    "v_instance_of_prop": {
                        type: 'id_array',
                        val: [311],
                    },
                },
                queries: [
                    // selection props
                    // {
                    //     type: 'claim',
                    //
                    //     group: 0,
                    //     identities: {
                    //         label: true,
                    //         alias: 'p_get_alias',
                    //         description: false,
                    //         sitelink: false,
                    //         class: false,
                    //     },
                    //     props: {
                    //         entity_ref: ["v_instance_of_prop"]
                    //     }
                    // },
                    // rank (class, active)
                    {
                        type: 'class',
                        group: 1,
                        class: [[4276260]],
                    },
                ]
            };

            // dataSet.should.deep.equal(expRes);
        })

    })
})
