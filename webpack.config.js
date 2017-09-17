module.exports = {
    entry: './model/charts.js',
    output: {
        filename: 'lib.js',
        path: __dirname + '/wwwroot/scripts/',
        library: 'lib',
        libraryTarget: 'var'
    },
    module: {
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    externals: {
        "d3": "d3"
    }
}