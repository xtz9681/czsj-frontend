import { request } from './request'

export function getAllergyList(subjectType, subjectId) {
  return request({ url: '/allergy', data: { subjectType, subjectId } })
}

export function addAllergy(subjectType, subjectId, ingredientName, severity) {
  return request({
    url: '/allergy',
    method: 'POST',
    data: { subjectType, subjectId, ingredientName, severity: severity || 'MILD' }
  })
}

export function removeAllergy(id) {
  return request({ url: `/allergy/${id}`, method: 'DELETE' })
}
