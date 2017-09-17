var path = require('path');
const webpack = require('webpack');

module.exports = {
    // devtool: `cheap-module-source-map`,
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         warnings: false,
        //         screw_ie8: true
        //     },
        //     comments: false,
        //     sourceMap: false
        // })
    ],
    context: path.join(__dirname, "/client/src"),
    entry: {
        "pages/index"                       : "./pages/index/index.jsx",
        "infographics/test"                 : "./infographics/test/loader.js",
        "infographics/base__home"           : "./infographics/home/loader.js",
        "infographics/base__search_result"  : "./infographics/search_result/loader.js"
    },
    resolve: {
        extensions: ['', '.js']
    },
    output: {
        path: path.join(__dirname, "/client/bin"),
        filename: "[name].min.js"
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: ['babel'],
        }]
    },
    devtool: 'source-map'
};
