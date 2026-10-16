import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { ApplicationForm } from '../components/ApplicationForm'
import { form } from '../content/sections'
import type { SubmitResult } from '../lib/lead-submission'

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Имя'), 'Анна')
  await user.type(screen.getByPlaceholderText('+7 900 000-00-00'), '+7 900 123-45-67')
  await user.click(screen.getByRole('checkbox', { name: /обработку персональных данных/ }))
}

describe('страница', () => {
  it('блоки идут в порядке 01–07', () => {
    const { container } = render(<App path="/" />)
    const ids = [...container.querySelectorAll('header.hero, section[id], footer')].map(
      (el) => el.id || el.tagName.toLowerCase(),
    )
    expect(ids.slice(0, 6)).toEqual(['header', 'prologue', 'dinner', 'vendors', 'benefits', 'application'])
    expect(ids.at(-1)).toBe('footer')
  })

  it('все CTA ведут на #application', () => {
    render(<App path="/" />)
    const ctas = screen.getAllByRole('link', { name: /Оставить заявку на участие|Хочу на этот вечер/ })
    expect(ctas.length).toBeGreaterThanOrEqual(3)
    ctas.forEach((a) => expect(a).toHaveAttribute('href', '#application'))
  })

  it('правовые страницы — явные заглушки', () => {
    render(<App path="/privacy" />)
    expect(screen.getByText(/ДОКУМЕНТ НЕ УТВЕРЖДЁН/)).toBeInTheDocument()
  })

  it('на первом экране не показывает факты, которых нет', () => {
    render(<App path="/" />)
    const ticket = screen.getByLabelText('Билет')
    expect(within(ticket).getAllByText('уточняется').length).toBeGreaterThanOrEqual(5)
  })
})

describe('форма заявки', () => {
  it('не отправляется без обязательных полей и согласия', async () => {
    const submit = vi.fn()
    const user = userEvent.setup()
    render(<ApplicationForm submit={submit} />)
    await user.click(screen.getByRole('button', { name: 'Отправить заявку' }))
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByText(form.errors.nameRequired)).toBeInTheDocument()
    expect(screen.getByText(form.errors.consentRequired)).toBeInTheDocument()
  })

  it('согласие не отмечено заранее', () => {
    render(<ApplicationForm submit={vi.fn()} />)
    expect(screen.getByRole('checkbox', { name: /обработку персональных данных/ })).not.toBeChecked()
  })

  it('успех показывается только после положительного ответа сервера', async () => {
    let resolve!: (r: SubmitResult) => void
    const submit = vi.fn(() => new Promise<SubmitResult>((r) => (resolve = r)))
    const user = userEvent.setup()
    render(<ApplicationForm submit={submit} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Отправить заявку' }))

    expect(screen.queryByText(form.success)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: form.submitting })).toBeDisabled()
    resolve({ status: 'success' })
    expect(await screen.findByText(form.success)).toBeInTheDocument()
  })

  it('защита от двойной отправки', async () => {
    const submit = vi.fn(() => new Promise<SubmitResult>(() => {}))
    const user = userEvent.setup()
    render(<ApplicationForm submit={submit} />)
    await fillValid(user)
    const btn = screen.getByRole('button', { name: 'Отправить заявку' })
    await user.dblClick(btn)
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('при ошибке сервера данные сохраняются, повтор использует тот же id запроса', async () => {
    const submit = vi
      .fn<(i: { clientRequestId: string }) => Promise<SubmitResult>>()
      .mockResolvedValueOnce({ status: 'error' })
      .mockResolvedValueOnce({ status: 'success' })
    const user = userEvent.setup()
    render(<ApplicationForm submit={submit as never} />)
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Отправить заявку' }))
    expect(await screen.findByText(form.error)).toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toHaveValue('Анна')

    await user.click(screen.getByRole('button', { name: 'Отправить заявку' }))
    await waitFor(() => expect(screen.getByText(form.success)).toBeInTheDocument())
    expect(submit.mock.calls[0][0].clientRequestId).toBe(submit.mock.calls[1][0].clientRequestId)
  })
})
