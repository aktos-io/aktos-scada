all: 
	webpack 

w: watch

watch: 
	webpack --watch 

view: 
	sensible-browser build/index.html
