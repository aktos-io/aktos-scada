.PHONY: all production clean

launch-broser:
	@firefox -new-tab -url http://localhost:4000 2>/dev/null &

#run-ide:
#	# this is fallback ide
#	echo '{"name": "aktos-webui", "files": [ { "directory": ".",  "recursive": 1 } ]}' > .kateproject
#	@kate .kateproject 2>/dev/null &


install-npm-packages:
	pm2 delete server 2> /dev/null; true
	rm -rf node_modules 2> /dev/null; true
	rm -rf .npm 2> /dev/null; true
	npm install

LOGINUSER := $$USER

production-get-changes:
	git stash 
	git pull 
	git stash pop 

production-update: 
	# build everything into ./public
	rm -r public 2> /dev/null & true
	sudo sh -c "ulimit -n 65536; sudo -u $(LOGINUSER) brunch build";
	node preparse.js

	# if everything went ok, then update the public dir
	rm server/public 2> /dev/null ; \
	rm -rf server/public.bak 2> /dev/null ; \
	mv server/public/ server/public.bak/ 2> /dev/null ; \
	mv public/ server/

production-run-server:
	cd server; \
	pm2 delete server; \
	pm2 start server.ls --interpreter=lsc --watch --ignore-watch='public' --max-memory-restart=160M
	watch pm2 status

production-optimize:
	@echo "USE uglify to minimize javascripts..."
	cd server/public/javascripts ; \
	uglifyjs app.js > app.min.js && \
	mv app.js app.js.bak && \
	mv app.min.js app.js ; \
	uglifyjs vendor.js > vendor.min.js && \
	mv vendor.js vendor.js.bak && \
	mv vendor.min.js vendor.js ; 

development-run-server:
	@echo "Starting server"
	cd server; \
	lsc server.ls

development-compile-watch:
	@echo "---- DO NOT FORGET TO SET development = yes in app.ls!!! -----"
	rm -rf server/public 2> /dev/null && \
	ln -sf ../public server/
	brunch watch
