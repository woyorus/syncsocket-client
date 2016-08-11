/* Adopted from https://github.com/socketio/socket.io-client/blob/master/support/webpack.config.js */

module.exports = {
    entry: './src/index.js',
    output: {
        library: 'syncsocket',
        libraryTarget: 'umd',
        filename: 'syncsocket.js'
    },
    externals: {
        global: glob()
    },
    module: {
        loaders: [

            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel', // 'babel-loader' is also a legal name to reference
                query: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            }

        ]
    }
};

/**
 * Populates `global`.
 * @private
 */
function glob() {
    return 'typeof self !== "undefined" ? self : ' +
        'typeof window !== "undefined" ? window : ' +
        'typeof global !== "undefined" ? global : {}';
}
