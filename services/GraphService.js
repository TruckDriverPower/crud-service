import fetch from "node-fetch"
import _ from "lodash"
import { ModelService } from "./ModelService.js"
import { gql } from "apollo-server"
import Pluralize from "pluralize"

import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json"
import { WorkerService } from "./WorkerService.js"

const models = {}
const getResolvers = async () => {
  const resolvers = {
    Query: {
      Options: async () => {
        const params = { access_token: process.env.TDP_ACCESS_TOKEN }
        const response = await fetch(process.env.API_ENDPOINT + "/options_schema", {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params), // body data type must match "Content-Type" header
        })
        return await response.json()
      },

      Models: async () => {
        const params = { access_token: process.env.TDP_ACCESS_TOKEN }
        const response = await fetch(process.env.API_ENDPOINT + "/model_schema", {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params), // body data type must match "Content-Type" header
        })
        return await response.json()
      },

      Fields: async () => {
        const params = { access_token: process.env.TDP_ACCESS_TOKEN }
        const response = await fetch(process.env.API_ENDPOINT + "/fields_schema", {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params), // body data type must match "Content-Type" header
        })
        return await response.json()
      },
    },

    Mutation: {
      requestAuthCode: async (parent, args, context, info) => {
        const user = await ModelService.findOne({ model: "User", args: { email: args.email } })
        if (user) {
          await WorkerService.enqueue({ queue: "critical", job: "SendEmailAuthorizationJob", args: [{ user_id: user.id }] })
          return { success: true, userId: user.id }
        } else {
          return { success: false }
        }
      },

      confirmAuthCode: async (parent, args, context, info) => {
        console.log(args)
        const params = { access_token: process.env.TDP_ACCESS_TOKEN, authentication_code: args.authentication_code, user_id: args.user_id }
        const response = await fetch(process.env.API_ENDPOINT + "/confirm_authentication_code", {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params), // body data type must match "Content-Type" header
        })
        return await response.json()
      },
    },

    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
  }

  const modelSchema = await ModelService.getModelSchema()
  _.forEach(modelSchema, (model, key) => {
    resolvers["Query"][key] = async (parent, args, context, info) => {
      return await ModelService.findOne({ model: key, args })
    }

    resolvers["Query"][`all${Pluralize(key)}`] = async (parent, args, context, info) => {
      return await ModelService.find({ model: key, args })
    }

    resolvers["Query"][`_all${Pluralize(key)}Meta`] = async (parent, args, context, info) => {
      return { count: 10 }
    }
  })

  return resolvers
}

const getTypeDefinitions = async () => {
  const modelSchema = await ModelService.getModelSchema()
  const typeDefinitions = [
    `
    scalar Date
    scalar JSON
    scalar JSONObject
    type Session {
      access_token: String
      id: ID
      user: User
    }
    type ListMetadata {
      count: Int!
    }
  `,
  ]

  /*
   *
   */
  const findQueries = [
    `
      Options: JSONObject
      Models: JSONObject
      Fields: JSONObject 
    `,
  ]
  const allQueries = []
  const metaQueries = []
  const filterInputs = []

  _.forEach(modelSchema, (model, key) => {
    /*
     * Define Type
     */
    const typeDefinition = `type ${key} {
      id: ID    
      offers: [Offer]
    ${_.join(
      _.map(model.fields, (field, key) => {
        return `${key}: ${field.graphqlType}`
      })
    )}
    }`

    typeDefinitions.push(typeDefinition)

    /*
     * Define Record Query
     */
    const findQuery = `${key}(id: ID!): ${key}`
    findQueries.push(findQuery)

    /*
     * Define All/Meta Query
     */
    const allQuery = `all${Pluralize(key)}(page: Int, perPage: Int, sortField: String, sortOrder: String, filter: ${key}Filter): [${key}]`
    const metaQuery = `_all${Pluralize(key)}Meta(page: Int, perPage: Int, sortField: String, sortOrder: String, filter: ${key}Filter): ListMetadata`

    allQueries.push(allQuery)
    metaQueries.push(metaQuery)

    /*
     * Define Filter Input
     */
    const filterInput = `
    input ${key}Filter {
      q: String
      id: ID
      ids: [ID]
      offeree_id: ID
      title: String 
    }`
    filterInputs.push(filterInput)
  })

  const schema = `type Query {
    ${_.join(findQueries, `\n`)}
    ${_.join(allQueries, `\n`)}
    ${_.join(metaQueries, `\n`)}
  }

  type Mutation {
    requestAuthCode(email: String): JSONObject
    confirmAuthCode(user_id: ID, authentication_code: String): JSONObject
  }

  ${_.join(typeDefinitions, `\n`)}
  ${_.join(filterInputs, `\n`)}
  `

  const graphQLSchema = gql`
    ${schema}
  `

  return graphQLSchema
  // _.forEach(modelSchema, (model) => {
  //   const string = ``
  // })
}

export const GraphService = { getResolvers, getTypeDefinitions }
