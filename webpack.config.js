const CopyWebpackPlugin = require('copy-webpack-plugin');
const {readFileSync} = require('fs');
const path = require('path');

function requiresExternals(filename, dependency) {
    const content = readFileSync(filename, 'utf-8');
    return content.includes(dependency);
}

module.exports = env => {
    const route = env.component.split('/');
    const prod = (process.env.NODE_ENV === 'production');
    const routingPath = env.hasOwnProperty('route') ? path.resolve(__dirname, env.route) : __dirname;

    const infileName = route[route.length - 1];
    const extensionCheck = infileName.split('.');
    const inFile = path.resolve(routingPath, env.component);
    const inFileExtension = extensionCheck[extensionCheck.length - 1];
    const outPath = path.resolve(routingPath, env.component.replace(infileName, ''));
    const filename = infileName.replace(`.${inFileExtension}`, '');

    let pluginsArray = [];
    if (requiresExternals(inFile, 'textract')) {
        pluginsArray.push(
            new CopyWebpackPlugin({
                patterns: [
                    {from: `${routingPath}/node_modules/textract/lib/extractors`, to: 'extractors'}
                ]
            })
        );
    }

    const output = {
        path: outPath,
        library: filename,
        libraryTarget: 'commonjs2',
        filename: `${filename}Min.js`
    };

    return {
        entry: inFile,
        output: output,
        target: 'node',
        plugins: pluginsArray,
        devtool: (prod) ? '' : 'eval-source-map',
        mode: prod ? 'production' : 'development',
        resolve: {
            alias: {
                app: path.resolve(__dirname, 'app/src'),
                shared: path.resolve(__dirname, 'shared/'),
            },
            extensions: ['.tsx', '.ts', '.js', '.jsx', '.json']
        },

        module: {
            rules: [
                {
                    test: /\.node$/,
                    loader: 'node-loader',
                },
                {
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                    test: /\.(js|jsx?|ts|tsx?)$/,
                    options: {
                        configFile: `${__dirname}/babel.config.js`
                    }
                },
                {
                    test: /\.html$/i,
                    loader: 'html-loader',
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                }
            ]
        },

        externals: [
            'aws-sdk',
            'aws-crt',
            'chrome-aws-lambda',
            '@aws-sdk/signature-v4-multi-region'
        ]
    }
};
