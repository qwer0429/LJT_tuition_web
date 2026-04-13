import http from '@/utils/http'

/**
 * 获取学年列表
 */
export function getAcademicYears() {
  return http({
    url: '/academic-years/',
    method: 'get'
  })
}
