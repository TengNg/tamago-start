cleandist:
	rm -rdf ./client/dist

commit-push:
	git add .
	git commit -m "automated commit $(shell date +'%Y-%m-%d %H:%M:%S')"
	git push origin v2

amend-push:
	git add .
	git commit --amend --no-edit
	git push origin v2 --force

format:
	cd client && npm run format
