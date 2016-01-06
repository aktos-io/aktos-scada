require "shelljs/global"
require! \webpack

# constants
compile-dir = "./build"
js-entry-point = "./src/client/init.ls"
jade-entry-point = "./src/client/static/index.jade"


/*
echo "clear build directory"
rm \-rf \./build/*
*/

module.exports =
  entry:
    * js-entry-point
    * "file?name=#{compile-dir}/index.html!jade-html?with=pretty!#{jade-entry-point}"
  output:
    path: __dirname
    filename: "#{compile-dir}/app.js"
  module:
    loaders:
      * test: /\.ls$/, loader: 'livescript-loader'
      * test: /\.css$/, loader: "style-loader!css-loader"
  plugins:
    * new webpack.optimize.CommonsChunkPlugin \./src/dep, "#{compile-dir}/vendor.js"
    ...
  resolve: extensions: ["", ".webpack.js", ".web.js", ".js", ".ls"]
