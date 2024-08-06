# TODO-Server

## Description

Simple express server app to store items in an items.json file.

## Methods

Get array of items

```
curl -X GET http://localhost:3000/items
```

Post one item

```
curl -X POST http://localhost:3000/item \
-H "Content-Type: application/json" \
-d "{\"id\":"1",\"name\":\"First Item\"}"
```

Delete item by id

```
curl -X DELETE http://localhost:3000/item/1
```
