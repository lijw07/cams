import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useForm } from '@/hooks/useForm'

interface TestFormData {
  name: string
  email: string
  age: number
}

describe('useForm', () => {
  const initialValues: TestFormData = {
    name: '',
    email: '',
    age: 0,
  }

  const validateForm = (values: TestFormData) => {
    const errors: Partial<Record<keyof TestFormData, string>> = {}
    
    if (!values.name) {
      errors.name = 'Name is required'
    }
    
    if (!values.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid'
    }
    
    if (values.age < 0) {
      errors.age = 'Age must be positive'
    }
    
    return errors
  }

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should provide all required methods', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    expect(typeof result.current.setFieldValue).toBe('function')
    expect(typeof result.current.setFieldError).toBe('function')
    expect(typeof result.current.setFieldTouched).toBe('function')
    expect(typeof result.current.resetForm).toBe('function')
    expect(typeof result.current.handleSubmit).toBe('function')
    expect(typeof result.current.validateField).toBe('function')
    expect(typeof result.current.validateForm).toBe('function')
  })

  it('should update field values', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setFieldValue('name', 'John Doe')
    })

    expect(result.current.values.name).toBe('John Doe')
    expect(result.current.values.email).toBe('')
    expect(result.current.values.age).toBe(0)
  })

  it('should set field errors', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setFieldError('email', 'Invalid email format')
    })

    expect(result.current.errors.email).toBe('Invalid email format')
  })

  it('should set field touched state', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    act(() => {
      result.current.setFieldTouched('name')
    })

    expect(result.current.touched.name).toBe(true)

    act(() => {
      result.current.setFieldTouched('email', false)
    })

    expect(result.current.touched.email).toBe(false)
  })

  it('should clear error when field value changes', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    // Set an error first
    act(() => {
      result.current.setFieldError('name', 'Name is required')
    })

    expect(result.current.errors.name).toBe('Name is required')

    // Update field value - should clear the error
    act(() => {
      result.current.setFieldValue('name', 'John')
    })

    expect(result.current.errors.name).toBeUndefined()
    expect(result.current.values.name).toBe('John')
  })

  it('should validate individual fields', () => {
    const { result } = renderHook(() => useForm({ 
      initialValues, 
      validate: validateForm 
    }))

    // Test empty name validation
    expect(result.current.validateField('name')).toBe('Name is required')

    // Update name and test again
    act(() => {
      result.current.setFieldValue('name', 'John')
    })

    expect(result.current.validateField('name')).toBeUndefined()

    // Test invalid email
    act(() => {
      result.current.setFieldValue('email', 'invalid-email')
    })

    expect(result.current.validateField('email')).toBe('Email is invalid')
  })

  it('should validate entire form', () => {
    const { result } = renderHook(() => useForm({ 
      initialValues, 
      validate: validateForm 
    }))

    // Initial form should be invalid
    act(() => {
      const isValid = result.current.validateForm()
      expect(isValid).toBe(false)
    })

    expect(result.current.errors.name).toBe('Name is required')
    expect(result.current.errors.email).toBe('Email is required')

    // Fill in valid data
    act(() => {
      result.current.setFieldValue('name', 'John Doe')
      result.current.setFieldValue('email', 'john@example.com')
      result.current.setFieldValue('age', 25)
    })

    act(() => {
      const isValid = result.current.validateForm()
      expect(isValid).toBe(true)
    })

    expect(Object.keys(result.current.errors)).toHaveLength(0)
  })

  it('should mark all fields as touched when validating form', () => {
    const { result } = renderHook(() => useForm({ 
      initialValues, 
      validate: validateForm 
    }))

    act(() => {
      result.current.validateForm()
    })

    expect(result.current.touched.name).toBe(true)
    expect(result.current.touched.email).toBe(true)
    expect(result.current.touched.age).toBe(true)
  })

  it('should reset form to initial state', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    // Make changes
    act(() => {
      result.current.setFieldValue('name', 'John')
      result.current.setFieldError('email', 'Some error')
      result.current.setFieldTouched('name')
    })

    expect(result.current.values.name).toBe('John')
    expect(result.current.errors.email).toBe('Some error')
    expect(result.current.touched.name).toBe(true)

    // Reset form
    act(() => {
      result.current.resetForm()
    })

    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should handle form submission', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined)
    const validValues: TestFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    }

    const { result } = renderHook(() => useForm({
      initialValues: validValues,
      validate: validateForm,
      onSubmit: mockOnSubmit,
    }))

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockOnSubmit).toHaveBeenCalledWith(validValues)
  })

  it('should not submit if form is invalid', async () => {
    const mockOnSubmit = vi.fn()

    const { result } = renderHook(() => useForm({
      initialValues,
      validate: validateForm,
      onSubmit: mockOnSubmit,
    }))

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should set isSubmitting during form submission', async () => {
    let resolveSubmit: () => void
    const mockOnSubmit = vi.fn().mockImplementation(() => {
      return new Promise<void>(resolve => {
        resolveSubmit = resolve
      })
    })

    const validValues: TestFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    }

    const { result } = renderHook(() => useForm({
      initialValues: validValues,
      validate: validateForm,
      onSubmit: mockOnSubmit,
    }))

    const submitPromise = act(async () => {
      return result.current.handleSubmit()
    })

    // Should be submitting
    expect(result.current.isSubmitting).toBe(true)

    // Resolve the promise
    resolveSubmit!()
    await submitPromise

    // Should not be submitting anymore
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should handle submission errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const submitError = new Error('Submission failed')
    const mockOnSubmit = vi.fn().mockRejectedValue(submitError)

    const validValues: TestFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    }

    const { result } = renderHook(() => useForm({
      initialValues: validValues,
      validate: validateForm,
      onSubmit: mockOnSubmit,
    }))

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith('Form submission error:', submitError)
    expect(result.current.isSubmitting).toBe(false)

    consoleErrorSpy.mockRestore()
  })

  it('should prevent default form submission', async () => {
    const mockOnSubmit = vi.fn()
    const mockEvent = {
      preventDefault: vi.fn(),
    } as any

    const { result } = renderHook(() => useForm({
      initialValues,
      onSubmit: mockOnSubmit,
    }))

    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it('should work without validation function', () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    expect(result.current.validateField('name')).toBeUndefined()
    
    act(() => {
      const isValid = result.current.validateForm()
      expect(isValid).toBe(true)
    })
  })

  it('should work without onSubmit function', async () => {
    const { result } = renderHook(() => useForm({ initialValues }))

    await act(async () => {
      await result.current.handleSubmit()
    })

    // Should not throw error
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useForm({ initialValues }))

    const initialFunctions = {
      setFieldValue: result.current.setFieldValue,
      setFieldError: result.current.setFieldError,
      setFieldTouched: result.current.setFieldTouched,
      resetForm: result.current.resetForm,
      handleSubmit: result.current.handleSubmit,
      validateField: result.current.validateField,
      validateForm: result.current.validateForm,
    }

    rerender()

    expect(result.current.setFieldValue).toBe(initialFunctions.setFieldValue)
    expect(result.current.setFieldError).toBe(initialFunctions.setFieldError)
    expect(result.current.setFieldTouched).toBe(initialFunctions.setFieldTouched)
    expect(result.current.resetForm).toBe(initialFunctions.resetForm)
    expect(result.current.handleSubmit).toBe(initialFunctions.handleSubmit)
    expect(result.current.validateField).toBe(initialFunctions.validateField)
    expect(result.current.validateForm).toBe(initialFunctions.validateForm)
  })

  it('should handle complex object field values', () => {
    interface ComplexForm {
      user: {
        profile: {
          name: string
          settings: {
            theme: string
          }
        }
      }
    }

    const complexInitialValues: ComplexForm = {
      user: {
        profile: {
          name: '',
          settings: {
            theme: 'light'
          }
        }
      }
    }

    const { result } = renderHook(() => useForm({ initialValues: complexInitialValues }))

    const newUserData = {
      profile: {
        name: 'John Doe',
        settings: {
          theme: 'dark'
        }
      }
    }

    act(() => {
      result.current.setFieldValue('user', newUserData)
    })

    expect(result.current.values.user).toEqual(newUserData)
  })

  describe('edge cases', () => {
    it('should handle rapid field updates', () => {
      const { result } = renderHook(() => useForm({ initialValues }))

      act(() => {
        result.current.setFieldValue('name', 'J')
        result.current.setFieldValue('name', 'Jo')
        result.current.setFieldValue('name', 'Joh')
        result.current.setFieldValue('name', 'John')
      })

      expect(result.current.values.name).toBe('John')
    })

    it('should handle setting the same field value multiple times', () => {
      const { result } = renderHook(() => useForm({ initialValues }))

      act(() => {
        result.current.setFieldValue('name', 'John')
        result.current.setFieldValue('name', 'John')
        result.current.setFieldValue('name', 'John')
      })

      expect(result.current.values.name).toBe('John')
    })

    it('should handle null and undefined values', () => {
      interface NullableForm {
        optionalField?: string | null
        requiredField: string
      }

      const nullableInitialValues: NullableForm = {
        optionalField: null,
        requiredField: '',
      }

      const { result } = renderHook(() => useForm({ initialValues: nullableInitialValues }))

      act(() => {
        result.current.setFieldValue('optionalField', undefined)
      })

      expect(result.current.values.optionalField).toBeUndefined()

      act(() => {
        result.current.setFieldValue('optionalField', null)
      })

      expect(result.current.values.optionalField).toBeNull()
    })

    it('should handle validation function that throws errors', () => {
      const errorValidate = () => {
        throw new Error('Validation error')
      }

      const { result } = renderHook(() => useForm({ 
        initialValues, 
        validate: errorValidate 
      }))

      expect(() => {
        act(() => {
          result.current.validateForm()
        })
      }).toThrow('Validation error')
    })
  })
})