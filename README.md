## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Usage (Example)
```bash
# /smxs/v2/discovery-service
$ curl -H 'Accept: application/json' -H 'Accept-Language: en' http://localhost:8000/smxs/v2/discovery-service

# /smxs/v2/peers
$ curl -H 'Accept: application/json' -H 'Accept-Language: en' http://localhost:8000/smxs/v2/peers

# /smxs/v2/services
$ curl -H 'Accept: application/json' -H 'Accept-Language: en' http://localhost:8000/smxs/v2/services

# /smxs/v2/service-description?service-id={service-id}
$ curl -H 'Accept: application/json' -H 'Accept-Language: en' 'http://localhost:8000/smxs/v2/service-description?service-id=SMXS-2.0.0'
```

## Description

This SWIM Discovery Service is devloped by KAC. 

## License

This SWIM Discovery Service is [MIT licensed](LICENSE).
