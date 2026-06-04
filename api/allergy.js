import { request } from './request'

// subjectType: 'BABY', subjectId: babyId
export function getAllergyList(babyId) {
  return request({ url: '/allergy', data: { subjectType: 'BABY', subjectId: babyId } })
}

export function addAllergy(babyId, ingredientName, severity) {
  return request({
    url: '/allergy',
    method: 'POST',
    data: { subjectType: 'BABY', subjectId: babyId, ingredientName, severity: severity || 'MILD' }
  })
}

export function removeAllergy(id) {
  return request({ url: `/allergy/${id}`, method: 'DELETE' })
}
