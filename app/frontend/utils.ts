export function getFormData<T>(form: HTMLFormElement): Partial<T> {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries()) as Partial<T>;
}

export function isNotNull<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isNotEmpty<T>(value: T): value is NonNullable<T> {
  if (value === null || value === undefined) return false;

  if (value && typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return value !== '';
}

export function qaLogger(output) {
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
