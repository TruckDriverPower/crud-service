import fetch from "node-fetch"
import _ from "lodash"
import mongoose from "mongoose"

const models = {}
let modelSchema

/*
 * Build Model Field Schema
 */
const setModels = async () => {
  _.forEach(modelSchema, (model, key) => {
    const fields = {}
    _.forEach(model.fields, (fieldOpts, fieldKey) => {
      if (fieldKey != "_id") {
        fields[fieldKey] = { type: mongoose.Types[fieldOpts["type"]] || fieldOpts["type"] }
        if (fieldOpts["default"]) fields[fieldKey]["default"] = fieldOpts["default"]
      }
    })
    const schema = new mongoose.Schema(fields)
    models[key] = mongoose.model(key, schema, model.collection)
  })
}

const setModelSchema = async () => {
  const params = { access_token: process.env.TDP_ACCESS_TOKEN }
  const response = await fetch(process.env.API_ENDPOINT + "/model_schema", {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params), // body data type must match "Content-Type" header
  })
  modelSchema = await response.json()
}

const getModelSchema = async () => {
  return modelSchema
}

const getModels = async () => {
  return models
}

const findOne = async ({ model, args }) => {
  const _type = _.get(modelSchema, `[${model}]["_type"]`)
  if (_type) args["_type"] = _type

  if (args["id"]) args = { _id: args["id"] }
  const record = await models[model].findOne(args).exec()
  if (!!record) {
    const result = { ...record.toObject(), id: record["_id"].toString() }
    return result
  }
}

const find = async ({ model, args }) => {
  const params = { ...args.filter }

  if (args.filter.ids) {
    params["_id"] = { $in: args.filter.ids }
    delete params["ids"]
  }

  if (!!params.q) {
    params["$text"] = { $search: params.q }
    delete params["q"]
  }

  const _type = _.get(modelSchema, `[${model}]["_type"]`)
  if (_type) params["_type"] = _type

  const count = args.perPage || 25
  const skip = (args.page || 0) * count || 0
  const sort = args.sortField || "id"
  const order = args.sortOrder === "DESC" ? -1 : 1

  console.log(model, JSON.stringify(params))
  const records = await models[model]
    .find(params)
    .skip(skip)
    .sort({ [sort]: order })
    .limit(count)
    .allowDiskUse(true)
    .exec()
  return records
}

const count = async ({ model, args }) => {
  const params = { ...args.filter }
  if (args.filter.ids) {
    params["_id"] = { $in: args.filter.ids }
    delete params["ids"]
  }

  const count = await models[model].count(params).exec()
  return count
}

const create = async ({ model, args }) => {
  // return { ...args, id: "abc" }
  delete args["_id"]
  delete args["id"]
  const record = await models[model].create(args)
  return record

  // return await new Promise((resolve, reject) => {
  //     console.warn(record)
  //     resolve(record)
  //   })
  // })
  // await record.save()
  // console.warn(record)
  // // const record = await
  // return record
}

const updateOne = async ({ model, id, args }) => {
  await models[model].updateOne({ id }, args)
  const record = await models[model].findOne({ model, args: { id } })
  return record

  // return await new Promise((resolve, reject) => {
  //     console.warn(record)
  //     resolve(record)
  //   })
  // })
  // await record.save()
  // console.warn(record)
  // // const record = await
  // return record
}

export const ModelService = { setModelSchema, setModels, getModels, getModelSchema, findOne, find, count, create, updateOne }
