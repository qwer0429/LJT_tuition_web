import http from '@/utils/http'

/**
 * 获取学费支付记录列表
 * @param {Object} params 查询参数
 */
export function getTuitionPaymentList(params) {
  return http({
    url: '/tuition-payment/',
    method: 'get',
    params
  })
}

/**
 * 获取学费支付记录详情
 * @param {number} id 记录ID
 */
export function getTuitionPaymentDetail(id) {
  return http({
    url: `/tuition-payment/${id}/`,
    method: 'get'
  })
}

/**
 * 创建学费支付记录
 * @param {Object} data 记录数据
 */
export function createTuitionPayment(data) {
  return http({
    url: '/tuition-payment/',
    method: 'post',
    data
  })
}

/**
 * 更新学费支付记录
 * @param {number} id 记录ID
 * @param {Object} data 记录数据
 */
export function updateTuitionPayment(id, data) {
  return http({
    url: `/tuition-payment/${id}/`,
    method: 'put',
    data
  })
}

/**
 * 部分更新学费支付记录
 * @param {number} id 记录ID
 * @param {Object} data 记录数据
 */
export function patchTuitionPayment(id, data) {
  return http({
    url: `/tuition-payment/${id}/`,
    method: 'patch',
    data
  })
}

/**
 * 删除学费支付记录
 * @param {number} id 记录ID
 */
export function deleteTuitionPayment(id) {
  return http({
    url: `/tuition-payment/${id}/`,
    method: 'delete'
  })
}

/**
 * 批量创建学费支付记录
 * @param {Array} records 记录数组
 */
export function batchCreateTuitionPayment(records) {
  return http({
    url: '/tuition-payment/batch_create/',
    method: 'post',
    data: { records }
  })
}

/**
 * 批量更新学费支付记录
 * @param {Array} records 记录数组
 */
export function batchUpdateTuitionPayment(records) {
  return http({
    url: '/tuition-payment/batch_update/',
    method: 'post',
    data: { records }
  })
}

/**
 * 批量删除学费支付记录
 * @param {Array} ids ID数组
 */
export function batchDeleteTuitionPayment(ids) {
  return http({
    url: '/tuition-payment/batch_delete/',
    method: 'post',
    data: { ids }
  })
}

/**
 * 获取学费支付统计信息
 */
export function getTuitionPaymentStatistics() {
  return http({
    url: '/tuition-payment/statistics/',
    method: 'get'
  })
}

/**
 * 获取年级列表（用于筛选）
 */
export function getTuitionPaymentGrades() {
  return http({
    url: '/tuition-payment/grades/',
    method: 'get'
  })
}

/**
 * 导出学费支付记录
 * @param {Object} params 查询参数（academic_year）
 */
export function exportTuitionPayment(params) {
  return http({
    url: '/tuition-payment/export/',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
