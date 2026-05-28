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

test:
	cd server && npm run test

format:
	cd client && npm run format
