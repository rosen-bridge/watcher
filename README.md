# Watcher


### Table of Contents
- [Description](#description)  
- [Related Projects](#related-projects)
- [How to Run the Watcher](#how-to-run-the-watcher)
  - [Run in development mode](#run-in-development-mode)
  - [Run in production mode](#run-in-production-mode)
  - [Config](#config)
- [How to Be a Watcher](#how-to-be-a-watcher)
- [Contributing](#contributing)
- [License](#license)
<a name="headers"/>

## Description
A watcher is an entity within the bridge, observing the networks to report the bridge-related actions to the guards. Each watcher only observes one special network, creating commitment about the valid user actions. Once enough commitments were created by all watchers, one of them creates the event trigger. Finally, the event triggers will be processed at a higher level by the guards to do the final payments and transmissions. You can read more about the details here.


## Related Projects
Watcher uses some other Rosen-related projects to work properly. It uses the scanner to scan the source network for observations and scan the Ergo for the commitments and other related watcher data. It also uses some extractors to extract needed information from scanned blocks by the scanner. Watcher uses observation-extractor and watcher-data-extractor as the extractors assigned to its scanners.

## How to Run the Watcher
This project is written in node-js using Esnext module and typeorm database. In order to run the project follow these steps.

### Run in development mode
```shell
npm install
npm run start:dev
```

### Run in production mode
```shell
npm install
npm run start
```

### Config
You can find the project configs here. In this config, you should set what network you're going to observe (set watcher.network) and what's your secret key as the watcher (set ergo.watcherSecretKey). 

**Note:** If you didn't have a secret key, once you start the project, a random secret will be generated; you can use this secret that appears in the logs.

## How to Be a Watcher 
TBD

## Contributing
TBD

## License
TBD
