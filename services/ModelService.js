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
      fields[fieldKey] = { type: mongoose.Types[fieldOpts["type"]] || fieldOpts["type"], default: fieldOpts["default"] }
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
  return await models[model].findOne(args).exec()
}

const find = async ({ model, args }) => {
  const records = await models[model].find(args.filter).limit(10).exec()
  return records
}

export const ModelService = { setModelSchema, setModels, getModels, getModelSchema, findOne, find }
