# DumbCode Studio

The Dumbcode studio is the answer to the lack of a cohesive entity mod creation workflow for Minecraft

## What does it do?

The DumbCode Studio is a conjunction of tools for creating entity mods for minecraft. It includes:
- A Project File Handler
- A Modeler
- An Animator
- Texture mapping tools
- A variety of export options, including to our Lib format DumbLibrary

## The Modeler

The modler is heavily influenced by tabula in it's codebase. It uses almost the same model format, and can import files from tabula. 
The goal of the modeler is to take what we've lerned from using and contributing to Tabula, and turn it into a more user friendly experience.
Members of our team have used professional modeling solutions and many design decisions have been made based on the functionality of more powerful programs than previously avalible for minecraft modding use

Keep in mind this modeler is still in very early development and things like user interface and some functionality will be reorganized once we have the features implemented that we need to make it a useful piece of software.

## The animator v2

The DumbCode animator as previously known will be getting a rework and new design. We have been using this animator internally at DumbCode for a long while now, and have been noting everything that needs improved, is missing, and is wrong with it. We have determined the things we want to make it useful and are goign to start implementing them in a more final user facing state.

The animator is very powerful in functionality, and there is much more to come on it's features in the future.

## Summary and Disclaimer

DumbCode has been working on this project for a long time, and are very excited to make it useful to the public in the near future. Public functionality will come soon, and is technically avalible at the time of writing this, however it is not entirely useful.
Features are subject to change and using the software before it is released as Studio v1.0.0 is not reccomended unless you are using to test and provide feedback. Support will only be given in the form of future updates.

More news to come and make sure to keep up with us on Discord and on our Website for news to come.

### Contributing

`yarn run start` Runs the app in the development mode.
Open `http://localhost:3000` to view.

`yarn run build` Builds the React app for production to the `build` folder. 
This is optimized for production with minified css

`yarn run inline` Use `Gulp` to inline all the JavaScript and CSS files from the production build into a single minified file.