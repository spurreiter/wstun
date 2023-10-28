## Setup

1. install dependencies

   ```sh
   npm i
   ```

   > **Note** <br>
   > Don't use pnpm as packages from the host and the docker container are being
   > used.

2. edit docker compose file and set your local ip

   ```yaml
   services:
     wstun:
       extra_hosts:
         server: '192.168.179.10' # << change here
   ```

## Forward WS Tunnel

```
           host                         remote
        +--------+             +--------+      +---------+
        |        |----wstun--->|  :4000 |      |   :3000 |
   ====>| client |=====tcp====>| server |=====>| service |
:9000   |        |----wstun--->|        |      |         |
        +--------+             +--------+      +---------+
```

enter docker container

```sh
./run dcexec
```

in container start server

```sh
bin/wstun.js -t 127.0.0.1:3000 -s 4000
```

on host start client

```sh
bin/wstun.js -t 9000 ws://localhost:4000
```

issue a request

```sh
curl http://localhost:9000
```

## Reverse WS Tunnel

```
           host                        remote
        +--------+             +--------+      +---------+
        |  :8000 |<---wstun----|        |      |   :3000 |
  =====>| server |=====tcp====>| client |=====>| service |
:9000   |        |<---wstun----|        |      |         |
        +--------+             +--------+      +---------+
```

start docker container

```sh
./run dcup
```

start local server

```sh
bin/wstun.js -r -s 8000
# with tls
bin/wstun.js -r -s 8000 --key too.nice.key --cert too.nice.crt
```

enter docker container

```sh
bin/wstun.js -r -t 9000:127.0.0.1:3000 ws://too.nice:8000
# with tls
bin/wstun.js -r -t 9000:127.0.0.1:3000 wss://too.nice:8000 --ca too.nice.crt
```

now reverse connection from server :9000 --> to client :3000 is established

make request from host (local)

```sh
curl http://localhost:9000
```
