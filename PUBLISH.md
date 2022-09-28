# How to publish packages

1. Enter the master branch and check that pipelines are green

```bash
git checkout master
```

2. reset your current master branch to the latest state by

```bash
git fetch
git reset origin/master --hard
```

3. Checkout a new branch that we'll release versions from

```bash
git checkout -b release-new-version-[a-b-c]
```

4.  Start the publishing procedure (\*\*)

    1.  Check the current version using

```bash
npm version
```

    2.  Update the version you would to like to publish

```bash
npm version [version] # version -> major, minor, patch ... version`

```

    3.  Commit the changes

    4.  Make a new git tag

```bash
git tag [tag] # tag -> v1.2.0`
```

    5.  Push the branch

```bash
git tag [tag] # tag -> v1.2.0`

```

5.  Publish the package.

```bash
npm publish
```

6. Open a PR of your release branch and get an approval to finally merge the release it into master

```bash
git checkout master && git reset origin/master --hard
git merge origin/release-new-version-[a-b-c] --ff-only
git push origin master
```

5. Create a release note (Use template from older release tags https://github.com/signavio/i18n/releases)

   1. Add summary: Describe the changes/packages of this release
   2. Add the release tag created in the previous steps: (v1.2.0)
   3. Add title: #<release-number> release of i18n packages

6. Great Job! You've done it. 🎉
