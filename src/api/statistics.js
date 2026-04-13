import http from '@/utils/http'

/**
 * 获取学费统计数据
 * @param {Object} params 查询参数
 * @param {string} params.academic_year 学年
 * @param {string} params.grade 年级
 * @param {string} params.payment_type 支付方式
 */
export function getTuitionStatistics(params) {
  return http({
    url: '/tuition-statistics/',
    method: 'get',
    params
  })
}

/**
 * 导出学费统计数据
 * @param {Object} params 查询参数
 */
export function exportTuitionStatistics(params) {
  return http({
    url: '/tuition-statistics/export/
    method: 'get',
    params,
    responseType: 'blob'
  })
}
