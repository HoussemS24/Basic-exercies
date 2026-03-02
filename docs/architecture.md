# Architecture
```mermaid
flowchart LR
Desktop-->API
API-->Postgres
API-->Qdrant
Desktop-->Keychain
API-->MockThingWorx
```
