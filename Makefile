cleandist:
	rm -rdf ./client/dist

auto-commit-master:
	git add .
	git commit -m "automated commit $(shell date +'%Y-%m-%d %H:%M:%S')"
	git push origin master

auto-commit-v2:
	git add .
	git commit -m "automated commit $(shell date +'%Y-%m-%d %H:%M:%S')"
	git push origin v2
