# NODEX

Node.js application parts

## DEVELOPMENT GUIDE

Setup:

```
$ npm i -g yarn lerna
$ yarn install
```

Test projects:

```
$ yarn workspaces test
OR
$ lerna run test --stream
```

Build projects:

```
$ yarn workspaces build
OR
$ lerna run build --stream
```

Clean project build files:

```
$ yarn workspaces clean
OR
$ lerna run clean --stream
```
