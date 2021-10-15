import { Worker, Plugins, Scheduler, Queue } from "node-resque"
import { redisConfig } from "../redis.js"

const Jobs = {}
const enqueue = async ({ queue, job, args }) => {
  const queueConnection = new Queue({ connection: redisConfig }, { ...Jobs })
  queueConnection.on("error", (error) => console.log(error))
  await queueConnection.connect()
  await queueConnection.enqueue(queue, job, args)
  await queueConnection.end()
}

const listJobs = async ({ queueName }) => {
  const queue = new Queue({ connection: redisConfig }, { ...Jobs })
  queue.on("error", (error) => console.log(error))
  await queue.connect()
  await queue.end()
}

export const WorkerService = { enqueue, listJobs }
