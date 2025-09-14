const qaLogger = (output) => {
  try {
    // ENV check in the future for non prod envs
    // if (process.env.QA_LOGGING !== "true") return null
    if (true) {
      console.log(`[QA] - ${output}`)
    }
  } catch (error) {
    console.error("[QA Logger Error]:", error)
  }
}

export default qaLogger
