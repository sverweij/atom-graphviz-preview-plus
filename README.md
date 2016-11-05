# GraphViz preview+

Write and preview GraphViz dot. Shortcut: `ctrl-shift-V`.

Enabled for `.dot` files

![animated gif demoing live preview](https://raw.githubusercontent.com/sverweij/atom-graphviz-preview-plus/master/assets/graphviz-preview-plus.gif)

## Features
- **live rendering** of your diagram
- **SVG export** - to file or clipboard
- **PNG export** - to file
- **Switch** the GraphViz **layout engine**. GraphViz Preview+ will
  remember the last one you used.
- For syntax hihglighting we recommend 
  [language-dot](https://github.com/AdoPi/language-dot) (the only one in 
  `apm` at the moment). If it's not installed, GraphViz preview+ will take
  care of the installation.
- Uses **[viz.js](https://github.com/mdaines/viz.js)** package for parsing and
  rendering, so no need to have graphviz installed.
- _Can_ use the original graphviz command line version if you want it to; 
  tick the _use GraphViz command line_ option in the settings 

## Why another GraphViz previewer?
Because I needed one.

There is an [other](https://atom.io/packages/graphviz-preview)
atom package for GraphViz. It is in dire need of
maintenance (e.g. it [doesn't](https://github.com/jumpkick/graphviz-preview/issues/32)
[work](https://github.com/jumpkick/graphviz-preview/pull/33)
[very well](https://github.com/jumpkick/graphviz-preview/issues/28)
in Atom versions > 1.0.0), but seems to be abandoned - last activity
is from May 2016.

GraphViz preview+ takes a more 'Atom-native' approach to integrating GraphViz.
This should make your GraphViz editing experience in Atom more pleasant.
Live rendering and svg export work out of the box; engine switching,
exporting to other formats and a lot of potential future features are easy
to implement, usually with just a few lines of code.

## License information
- This software is free software [licensed under GPL-3.0](LICENSE.md). This means
  (a.o.) you _can_ use it as part of other free software, but _not_ as part of
  non free software.
- viz.js is [BSD](https://github.com/mdaines/viz.js/blob/master/LICENSE) licensed,
- GraphViz is licensed under the [EPL](http://graphviz.org/License.php).

## Build status
[![Build Status](https://travis-ci.org/sverweij/atom-graphviz-preview-plus.svg?branch=master)](https://travis-ci.org/sverweij/atom-graphviz-preview-plus)
[![Build status](https://ci.appveyor.com/api/projects/status/i4dlprwi46rja2ve/branch/master?svg=true)](https://ci.appveyor.com/project/sverweij/atom-graphviz-preview-plus/branch/master)
[![Dependency Status](https://david-dm.org/sverweij/atom-graphviz-preview-plus.svg)](https://david-dm.org/sverweij/atom-graphviz-preview-plus)
[![devDependency Status](https://david-dm.org/sverweij/atom-graphviz-preview-plus/dev-status.svg)](https://david-dm.org/sverweij/atom-graphviz-preview-plus#info=devDependencies)
