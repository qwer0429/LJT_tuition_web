<template>
  <div class="app-container">
    <!-- 筛选栏 -->
    <el-card class="filter-container" shadow="never">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="invoice_no号码：" style="width: 100%;">
              <el-select
                v-model="queryParams.invoice_no"
                placeholder="请选择或输入家庭编号"
                clearable
                filterable
                style="width: 100%;"
                @change="handleQuery"
              >
                <el-option
                  v-for="item in familyOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="学生搜索：" style="width: 100%;">
              <el-input
                v-model="queryParams.search"
                placeholder="姓名/学号"
                clearable
                style="width: 100%;"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="付款状态：" style="width: 100%;">
              <el-select v-model="queryParams.payment_status" placeholder="全部" clearable style="width: 100%;" @change="handleQuery">
                <el-option label="已付清" value="paid" />
                <el-option label="有欠款" value="unpaid" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="学年：" style="width: 100%;">
              <el-select v-model="queryParams.academic_year" placeholder="全部" clearable style="width: 100%;" @change="handleAcademicYearChange">
                <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="年级：" style="width: 100%;">
              <el-select v-model="queryParams.grade" placeholder="全部" clearable style="width: 100%;" @change="handleQuery">
                <el-option v-for="grade in gradeOptions" :key="grade" :label="grade" :value="grade" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
              <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="operate-container" shadow="never" style="margin-top: 15px;">
      <div class="table-operation">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增</el-button>
        <el-button type="success" icon="el-icon-download" @click="handleExport">导出数据</el-button>
        <el-button icon="el-icon-refresh" @click="refreshData">刷新</el-button>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="15" style="margin-top: 15px;">
      <el-col :span="4">
        <el-card shadow="hover" :body-style="{ padding: '15px' }">
          <div style="color: #909399; font-size: 13px;">总记录数</div>
          <div style="font-size: 24px; font-weight: bold; color: #303133; margin-top: 8px;">{{ statisticsData.record_count }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" :body-style="{ padding: '15px' }">
          <div style="color: #909399; font-size: 13px;">学生人数（去重）</div>
          <div style="font-size: 24px; font-weight: bold; color: #409EFF; margin-top: 8px;">{{ statisticsData.student_count }}</div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" :body-style="{ padding: '15px' }">
          <div style="color: #909399; font-size: 13px;">应付总额</div>
          <div style="font-size: 20px; font-weight: bold; color: #303133; margin-top: 8px;">¥{{ formatMoney(statisticsData.total_payable) }}</div>
        </el-card>
      </el-col>
      <el-col :span="5">
        <el-card shadow="hover" :body-style="{ padding: '15px' }">
          <div style="color: #909399; font-size: 13px;">已付总额</div>
          <div style="font-size: 20px; font-weight: bold; color: #67C23A; margin-top: 8px;">¥{{ formatMoney(statisticsData.total_paid) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" :body-style="{ padding: '15px' }">
          <div style="color: #909399; font-size: 13px;">欠款总额</div>
          <div style="font-size: 20px; font-weight: bold; color: #F56C6C; margin-top: 8px;">¥{{ formatMoney(statisticsData.total_balance) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-card class="table-container" shadow="never" style="margin-top: 15px;">
      <el-table
        ref="dataTable"
        v-loading="loading"
        :data="recordList"
        element-loading-text="加载中..."
        border
        fit
        highlight-current-row
        style="width: 100%;"
        height="100%"
      >
        <el-table-column label="学生" align="center" min-width="180">
          <template slot-scope="scope">
            <div style="font-weight: bold;">{{ scope.row.student_name }}</div>
            <div style="color: #909399; font-size: 12px;">学号: {{ scope.row.student_no }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" align="center" width="80" />
        <el-table-column prop="invoice_no" label="Invoice No号码" align="center" min-width="140" />
        <el-table-column prop="tuition_period" label="学费期间" align="center" min-width="160" />
        <el-table-column prop="tuition_days" label="学费期间天数" align="center" width="110" />
        <el-table-column label="家庭折扣" align="right" width="110">
          <template slot-scope="scope">
            <div v-if="scope.row.family_discount > 0" style="color: #E6A23C;">
              ¥{{ formatMoney(scope.row.family_discount) }}
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        <el-table-column label="其他折扣" align="right" width="110">
          <template slot-scope="scope">
            <div v-if="scope.row.other_discount > 0" style="color: #E6A23C;">
              ¥{{ formatMoney(scope.row.other_discount) }}
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        <el-table-column label="学费" align="right" header-align="center" min-width="130">
          <template slot-scope="scope">
            <div>应付: ¥{{ formatMoney(scope.row.tuition_payable) }}</div>
            <div v-if="Number(scope.row.paid_tuition_detail) > 0" style="color: #67C23A; font-size: 12px;">
              已付: ¥{{ formatMoney(scope.row.paid_tuition_detail) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="校车费" align="right" header-align="center" width="120">
          <template slot-scope="scope">
            <div v-if="Number(scope.row.school_bus_fee) > 0">
              <div>应付: ¥{{ formatMoney(scope.row.school_bus_fee) }}</div>
              <div v-if="Number(scope.row.paid_bus_detail) > 0" style="color: #67C23A; font-size: 12px;">
                已付: ¥{{ formatMoney(scope.row.paid_bus_detail) }}
              </div>
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        <el-table-column label="宿舍费" align="right" header-align="center" width="120">
          <template slot-scope="scope">
            <div v-if="Number(scope.row.dormitory_fee) > 0">
              <div>应付: ¥{{ formatMoney(scope.row.dormitory_fee) }}</div>
              <div v-if="Number(scope.row.paid_dormitory_detail) > 0" style="color: #67C23A; font-size: 12px;">
                已付: ¥{{ formatMoney(scope.row.paid_dormitory_detail) }}
              </div>
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        <el-table-column label="应付总额" align="right" width="120">
          <template slot-scope="scope">
            <span style="font-weight: bold;">¥{{ formatMoney(scope.row.total_payable) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已付总额" align="right" width="120">
          <template slot-scope="scope">
            <span style="color: #67C23A;">¥{{ formatMoney(scope.row.total_paid) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="欠款" align="right" width="120">
          <template slot-scope="scope">
            <span :style="((scope.row.total_payable || 0) - (scope.row.total_paid || 0)) > 0 ? 'color: #F56C6C; font-weight: bold;' : ''">
              ¥{{ formatMoney((scope.row.total_payable || 0) - (scope.row.total_paid || 0)) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleViewPaymentDetails(scope.row)">查看付款明细</el-button>
            <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" style="color: #f56c6c;" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

    </el-card>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        :total="total"
        :page-sizes="[50, 100, 500, 1000, 2000]"
        :page-size="queryParams.page_size"
        :current-page="queryParams.page"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog :title="isEdit ? '编辑记录' : '新增记录'" :visible.sync="editDialogVisible" width="900px">
      <div style="text-align: right; margin-bottom: 15px;">
        <el-button
          v-if="editForm.tuition_pdf_url"
          type="primary"
          size="small"
          icon="el-icon-view"
          @click="openPdfZoom"
        >
          查看学费单
        </el-button>
        <el-button v-else type="info" size="small" disabled icon="el-icon-document">暂无学费单PDF</el-button>
      </div>
      <el-form ref="editForm" :model="editForm" label-width="130px">
        <!-- 基础信息 -->
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学生姓名">
              <el-input v-model="editForm.student_name" placeholder="请输入学生姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学号">
              <el-input v-model="editForm.student_no" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="invoice_no号码">
              <el-input v-model="editForm.invoice_no" placeholder="请输入家庭编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学费期间">
              <el-date-picker
                v-if="!isEdit"
                v-model="editForm.tuitionPeriodRange"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%;"
                @change="val => handlePeriodChange('tuition', val)"
              />
              <div v-else class="readonly-field">{{ editForm.tuition_period || '-' }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年级">
              <el-input v-model="editForm.grade" placeholder="请输入年级" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 学费信息 -->
        <el-divider content-position="left">学费信息<span v-if="isEdit">（由学费单生成，只读）</span></el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学费期间天数">
              <el-input-number v-if="!isEdit" v-model="editForm.tuition_days" :min="0" :precision="0" :controls="false" style="width: 100%;" />
              <div v-else class="readonly-field">{{ editForm.tuition_days || '-' }} 天</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标准学费">
              <el-input-number v-if="!isEdit" v-model="editForm.base_tuition" :min="0" :precision="2" :controls="false" style="width: 100%;" />
              <div v-else class="readonly-field">¥{{ formatMoney(editForm.base_tuition) }}</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="注册费">
              <el-input-number v-if="!isEdit" v-model="editForm.registration_fee" :min="0" :precision="2" :controls="false" style="width: 100%;" />
              <div v-else class="readonly-field">¥{{ formatMoney(editForm.registration_fee) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="家庭折扣">
              <el-input-number v-if="!isEdit" v-model="editForm.family_discount" :min="0" :precision="2" :controls="false" style="width: 100%;" placeholder="留空表示无此项" />
              <div v-else class="readonly-field">¥{{ formatMoney(editForm.family_discount) }}</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="其他折扣">
              <el-input-number v-if="!isEdit" v-model="editForm.other_discount" :min="0" :precision="2" :controls="false" style="width: 100%;" placeholder="留空表示无此项" />
              <div v-else class="readonly-field">¥{{ formatMoney(editForm.other_discount) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应付学费">
              <el-input-number v-if="!isEdit" v-model="editForm.tuition_payable" :min="0" :precision="2" :controls="false" style="width: 100%;" />
              <div v-else class="readonly-field highlight">¥{{ formatMoney(editForm.tuition_payable) }}</div>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 校车费信息 -->
        <el-divider content-position="left">校车费信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="校车费期间">
              <el-date-picker
                v-model="editForm.busFeePeriodRange"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%;"
                @change="val => handlePeriodChange('bus', val)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="校车费">
              <el-input-number v-model="editForm.school_bus_fee" :min="0" :precision="2" :controls="false" style="width: 100%;" @change="calculateEditBalance" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 宿舍费信息 -->
        <el-divider content-position="left">宿舍费信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="住宿费期间">
              <el-date-picker
                v-model="editForm.dormitoryPeriodRange"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%;"
                @change="val => handlePeriodChange('dormitory', val)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="宿舍费">
              <el-input-number v-model="editForm.dormitory_fee" :min="0" :precision="2" :controls="false" style="width: 100%;" @change="calculateEditBalance" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 付款明细入口 -->
        <el-divider content-position="left">付款明细</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item>
              <el-button type="primary" size="small" icon="el-icon-edit" @click="paymentDetailEditDialogVisible = true">
                编辑付款明细（{{ editForm.payment_details.length }} 条）
              </el-button>
              <span v-if="editForm.payment_details.length === 0" style="color: #909399; margin-left: 10px;">暂无付款明细</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 付款汇总 -->
        <el-divider content-position="left">付款汇总</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="已付学费">
              <div class="readonly-field">¥{{ formatMoney(editForm.paid_tuition_fee) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="已付校车费">
              <div class="readonly-field">¥{{ formatMoney(editForm.paid_bus_fee) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="已付宿舍费">
              <div class="readonly-field">¥{{ formatMoney(editForm.paid_dormitory_fee) }}</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="欠款">
              <div class="readonly-field" :style="editForm.balance_due > 0 ? 'color: #F56C6C; font-weight: bold;' : ''">¥{{ formatMoney(editForm.balance_due) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实付金额">
              <div class="readonly-field highlight">¥{{ formatMoney(editForm.actual_paid_amount) }}</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 备注 -->
        <el-divider content-position="left">备注</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="三星特殊备注">
              <el-input v-model="editForm.samsung_special_remark" type="textarea" :rows="2" placeholder="请输入三星特殊备注" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="editForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </div>
    </el-dialog>

    <!-- 编辑付款明细弹窗 -->
    <el-dialog title="编辑付款明细" :visible.sync="paymentDetailEditDialogVisible" width="900px" :close-on-click-modal="false">
      <el-form label-width="90px">
        <div v-for="(detail, index) in editForm.payment_details" :key="detail.id || ('new-' + index)" class="payment-detail-item" style="border: 1px solid #EBEEF5; border-radius: 4px; padding: 15px; margin-bottom: 15px; background: #FAFAFA;">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="付款类型">
              <el-select v-model="detail.payment_type" placeholder="请选择" style="width: 100%;" @change="calculateEditBalance">
                <el-option label="学费" value="tuition" />
                <el-option label="校车费" value="bus" />
                <el-option label="宿舍费" value="dormitory" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="付款金额">
              <el-input-number v-model="detail.amount" :min="0" :precision="2" :controls="false" style="width: 100%;" placeholder="请输入金额" @change="calculateEditBalance" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="凭证号">
              <el-input v-model="detail.voucher_no" placeholder="请输入凭证号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="付款日期">
              <el-date-picker v-model="detail.paid_date" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="付款方">
              <el-input v-model="detail.payer_name" placeholder="请输入付款方" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="卡号">
              <el-input v-model="detail.card_no" placeholder="请输入卡号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="银行">
              <el-input v-model="detail.bank_name" placeholder="请输入银行" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="发票号码">
              <el-input v-model="detail.invoice_number" placeholder="请输入发票号码" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开票金额">
              <el-input-number v-model="detail.invoice_amount" :min="0" :precision="2" :controls="false" style="width: 100%;" placeholder="请输入开票金额" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发票内容">
              <el-input v-model="detail.invoice_content" placeholder="请输入发票内容" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="detail.remark" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
        <div style="text-align: right;">
          <el-button type="danger" size="mini" icon="el-icon-delete" @click="removePaymentDetail(index)">删除</el-button>
        </div>
      </div>
      </el-form>
      <div style="margin-bottom: 20px;">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="addPaymentDetail">添加付款明细</el-button>
        <span v-if="editForm.payment_details.length === 0" style="color: #909399; margin-left: 10px;">暂无付款明细</span>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="paymentDetailEditDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 查看付款明细对话框 -->
    <el-dialog :title="`${currentPaymentDetailStudent} - 付款明细`" :visible.sync="paymentDetailDialogVisible" width="1100px">
      <el-table :data="currentPaymentDetails" border size="small" style="width: 100%;" max-height="400">
        <el-table-column prop="payment_type" label="付款类型" align="center" width="90" fixed="left">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.payment_type === 'tuition'" type="primary" size="mini">学费</el-tag>
            <el-tag v-else-if="scope.row.payment_type === 'bus'" type="success" size="mini">校车费</el-tag>
            <el-tag v-else-if="scope.row.payment_type === 'dormitory'" type="warning" size="mini">宿舍费</el-tag>
            <span v-else>{{ scope.row.payment_type }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="付款金额" align="right" width="120">
          <template slot-scope="scope">¥{{ formatMoney(scope.row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="voucher_no" label="凭证号" align="center" width="120" />
        <el-table-column prop="paid_date" label="付款日期" align="center" width="110" />
        <el-table-column prop="payer_name" label="付款方" align="center" width="100" />
        <el-table-column prop="card_no" label="银行卡号" align="center" width="140" show-overflow-tooltip />
        <el-table-column prop="bank_name" label="银行名称" align="center" width="120" show-overflow-tooltip />
        <el-table-column prop="invoice_number" label="发票号码" align="center" width="120" />
        <el-table-column prop="invoice_amount" label="发票金额" align="right" width="120">
          <template slot-scope="scope">
            <span v-if="scope.row.invoice_amount">¥{{ formatMoney(scope.row.invoice_amount) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="invoice_content" label="发票内容" align="center" width="120" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" align="center" min-width="120" show-overflow-tooltip />
      </el-table>
      <div v-if="currentPaymentDetails.length === 0" style="text-align: center; color: #909399; padding: 20px;">暂无付款明细</div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="paymentDetailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 导出对话框 -->
    <el-dialog title="导出学费统计" :visible.sync="exportDialogVisible" width="450px">
      <el-form label-width="100px">
        <el-form-item label="学年">
          <el-select v-model="exportAcademicYear" placeholder="请选择学年" style="width: 100%;">
            <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出年级">
          <el-select
            v-model="exportGrades"
            multiple
            collapse-tags
            placeholder="不选则导出全部，多选则每个年级一个工作表"
            style="width: 100%;"
          >
            <el-option v-for="grade in sortedGradeOptions" :key="grade" :label="grade" :value="grade" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="success" @click="submitExport">导出</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getTuitionPaymentList,
  getTuitionPaymentGrades,
  getTuitionPaymentStatistics,
  exportTuitionPayment
} from '@/api/tuitionPayment'

export default {
  name: 'TuitionStatistics',
  data() {
    return {
      loading: false,
      queryParams: {
        page: 1,
        page_size: 50,
        academic_year: '',
        grade: '',
        payment_status: '',
        invoice_no: '',
        search: ''
      },
      academicYearOptions: [],
      gradeOptions: [],
      familyOptions: [],
      recordList: [],
      total: 0,
      statisticsData: {
        record_count: 0,
        student_count: 0,
        total_payable: 0,
        total_paid: 0,
        total_balance: 0
      },
      tableHeight: 600,
      currentRow: null,
      pdfZoomDialogVisible: false,
      zoomPdfUrl: '',
      editDialogVisible: false,
      editLoading: false,
      isEdit: false,
      exportDialogVisible: false,
      exportAcademicYear: '',
      exportGrades: [],
      paymentDetailDialogVisible: false,
      currentPaymentDetails: [],
      currentPaymentDetailStudent: '',
      paymentDetailEditDialogVisible: false,
      editForm: {
        id: null,
        student_no: '',
        student_name: '',
        invoice_no: '',
        tuition_period: '',
        tuitionPeriodRange: [],
        grade: '',
        base_tuition: 0,
        registration_fee: 0,
        family_discount: 0,
        other_discount: 0,
        tuition_payable: 0,
        tuition_days: 0,
        bus_fee_period: '',
        busFeePeriodRange: [],
        school_bus_fee: 0,
        dormitory_period: '',
        dormitoryPeriodRange: [],
        dormitory_fee: 0,
        tuition_voucher_no: '',
        paid_tuition_fee: 0,
        bus_voucher_no: '',
        paid_bus_fee: 0,
        dormitory_voucher_no: '',
        paid_dormitory_fee: 0,
        paid_date: '',
        balance_due: 0,
        actual_paid_amount: 0,
        payer_name: '',
        card_no: '',
        bank_name: '',
        invoice_number: '',
        invoice_amount: 0,
        invoice_content: '',
        samsung_special_remark: '',
        remark: '',
        payment_details: []
      }
    }
  },
  computed: {
    sortedGradeOptions() {
      const orderMap = {
        'Nursery': 1, 'ECEA': 2, 'ECEB': 3,
        'P1': 10, 'P2': 11, 'P3': 12, 'P4': 13, 'P5': 14, 'P6': 15,
        'M1': 20, 'M2': 21, 'M3': 22, 'M4': 23, 'M5': 24,
        'DP1': 30, 'DP2': 31
      }
      const getOrder = (grade) => {
        if (!grade) return 999
        const clean = grade.trim()
        if (orderMap[clean]) return orderMap[clean]
        for (const g in orderMap) {
          if (clean.startsWith(g)) return orderMap[g]
        }
        return 999
      }
      return [...this.gradeOptions].sort((a, b) => getOrder(a) - getOrder(b))
    }
  },
  created() {
    this.initData()
  },
  mounted() {
    this.calculateTableHeight()
    window.addEventListener('resize', this.calculateTableHeight)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calculateTableHeight)
  },
  methods: {
    // 计算表格高度
    calculateTableHeight() {
      const windowHeight = window.innerHeight
      // 减去顶部导航(50)、app-container padding(40)、筛选栏、操作栏、间距、分页(52)、card body padding(40)
      const filterCard = document.querySelector('.filter-container')
      const operateCard = document.querySelector('.operate-container')
      const filterHeight = filterCard ? filterCard.offsetHeight : 140
      const operateHeight = operateCard ? operateCard.offsetHeight : 60
      this.tableHeight = windowHeight - 50 - 40 - filterHeight - operateHeight - 30 - 52 - 40
    },

    // 初始化数据
    async initData() {
      await this.loadAcademicYearOptions()
      await this.loadGrades()
      await this.loadAllFamilies()
      this.loadRecordList()
    },

    // 从计算规则配置中加载学年选项
    async loadAcademicYearOptions() {
      try {
        const res = await this.$http.get('/tuitioncalculationconfig/')
        let configs = []
        if (Array.isArray(res)) {
          configs = res
        } else if (res.results && Array.isArray(res.results)) {
          configs = res.results
        } else if (res.data && Array.isArray(res.data)) {
          configs = res.data
        }
        const years = new Set()
        configs.forEach(item => {
          if (item.academic_year) {
            years.add(item.academic_year)
          }
        })
        this.academicYearOptions = Array.from(years).sort((a, b) => b.localeCompare(a))

        // 默认选中当前启用的计算规则学年
        if (!this.queryParams.academic_year) {
          const activeConfig = configs.find(c => c.is_active)
          if (activeConfig && activeConfig.academic_year) {
            this.queryParams.academic_year = activeConfig.academic_year
          }
        }
      } catch (error) {
        console.error('加载学年选项失败:', error)
      }
    },

    // 加载年级选项
    async loadGrades() {
      try {
        const res = await getTuitionPaymentGrades()
        this.gradeOptions = res.data || []
      } catch (error) {
        console.error('加载年级失败:', error)
      }
    },

    // 加载所有家庭编号（用于下拉搜索，不受分页限制）
    async loadAllFamilies() {
      try {
        const params = { type: 'record_families' }
        if (this.queryParams.academic_year) {
          params.academic_year = this.queryParams.academic_year
        }
        const res = await this.$http.get('/tuition/calculate/', { params })
        let dataList = []
        if (Array.isArray(res)) {
          dataList = res
        } else if (res.code === 1 && res.data) {
          if (Array.isArray(res.data)) {
            dataList = res.data
          } else if (res.data.families) {
            const families = res.data.families
            if (Array.isArray(families)) {
              dataList = families
            } else if (typeof families === 'object') {
              dataList = [...(families.all_yearly || []), ...(families.all_semester || []), ...(families.mixed || [])]
            }
          }
        } else if (res.results && Array.isArray(res.results)) {
          dataList = res.results
        }
        this.familyOptions = dataList
      } catch (error) {
        console.error('加载家庭编号列表失败:', error)
        this.familyOptions = []
      }
    },

    // 加载记录列表
    async loadRecordList() {
      this.loading = true
      try {
        const params = { ...this.queryParams }
        // 清理空参数
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key]
          }
        })

        const res = await getTuitionPaymentList(params)

        // 兼容多种返回格式：直接数组、DRF分页对象、包装对象
        if (Array.isArray(res)) {
          this.recordList = res.map(this.processRecord)
          this.total = res.length
        } else if (res.code === 1 || res.code === 200) {
          if (Array.isArray(res.data)) {
            this.recordList = res.data.map(this.processRecord)
            this.total = res.data.length
          } else if (res.data && Array.isArray(res.data.results)) {
            this.recordList = res.data.results.map(this.processRecord)
            this.total = res.data.count || res.data.results.length
          } else {
            this.recordList = []
            this.total = 0
          }
        } else if (Array.isArray(res.results)) {
          // DRF 默认分页格式
          this.recordList = res.results.map(this.processRecord)
          this.total = res.count || res.results.length
        } else {
          this.recordList = []
          this.total = 0
        }

        // 同时加载统计信息
        this.loadStatistics(params)
      } catch (error) {
        console.error('加载记录列表失败:', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },

    // 处理记录数据，后端已返回 total_payable / total_paid
    processRecord(record) {
      return record
    },

    // 加载统计信息
    async loadStatistics(params) {
      try {
        const res = await this.$http.get('/tuition-payment/statistics/', { params })
        if (res.code === 1 || res.code === 200) {
          const stats = res.data || {}
          this.statisticsData = {
            record_count: stats.record_count || 0,
            student_count: stats.student_count || 0,
            total_payable: (stats.tuition?.payable || 0) + (stats.bus_fee?.payable || 0) + (stats.dormitory_fee?.payable || 0),
            total_paid: (stats.tuition?.paid || 0) + (stats.bus_fee?.paid || 0) + (stats.dormitory_fee?.paid || 0),
            total_balance: stats.total_balance_due || 0
          }
        }
      } catch (error) {
        console.error('加载统计信息失败:', error)
      }
    },

    // 学年变化处理
    async handleAcademicYearChange() {
      this.queryParams.page = 1
      await this.loadAllFamilies()
      this.loadRecordList()
    },

    // 查询
    handleQuery() {
      this.queryParams.page = 1
      this.loadRecordList()
    },

    // 重置
    handleReset() {
      this.queryParams = {
        page: 1,
        page_size: this.queryParams.page_size,
        academic_year: '',
        grade: '',
        payment_status: '',
        invoice_no: '',
        search: ''
      }
      this.handleQuery()
    },

    // 刷新
    refreshData() {
      this.loadRecordList()
      this.$message.success('刷新成功')
    },

    // 分页
    handleSizeChange(val) {
      this.queryParams.page_size = val
      this.loadRecordList()
    },
    handleCurrentChange(val) {
      this.queryParams.page = val
      this.loadRecordList()
    },

    // 打开放大PDF
    openPdfZoom() {
      if (this.editForm && this.editForm.tuition_pdf_url) {
        window.open(this.editForm.tuition_pdf_url, '_blank')
      }
    },

    // 获取PDF文件名
    getPdfFilename(url) {
      if (!url) return ''
      const parts = url.split('/')
      return parts[parts.length - 1] || '学费单.pdf'
    },

    // 重置编辑表单
    resetEditForm() {
      this.editForm = {
        id: null,
        student_no: '',
        student_name: '',
        invoice_no: '',
        tuition_period: '',
        tuitionPeriodRange: [],
        grade: '',
        base_tuition: 0,
        registration_fee: 0,
        family_discount: undefined,
        other_discount: undefined,
        tuition_payable: 0,
        tuition_days: 0,
        bus_fee_period: '',
        busFeePeriodRange: [],
        school_bus_fee: 0,
        dormitory_period: '',
        dormitoryPeriodRange: [],
        dormitory_fee: 0,
        tuition_voucher_no: '',
        paid_tuition_fee: 0,
        bus_voucher_no: '',
        paid_bus_fee: 0,
        dormitory_voucher_no: '',
        paid_dormitory_fee: 0,
        paid_date: '',
        balance_due: 0,
        actual_paid_amount: 0,
        payer_name: '',
        card_no: '',
        bank_name: '',
        invoice_number: '',
        invoice_amount: undefined,
        invoice_content: '',
        samsung_special_remark: '',
        remark: '',
        payment_details: []
      }
    },

    // 打开新增对话框
    handleAdd() {
      this.isEdit = false
      this.resetEditForm()
      this.editDialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },

    // 打开编辑对话框
    async handleEdit(row) {
      this.isEdit = true
      const numeric = (val) => parseFloat(val) || 0
      try {
        // 先获取完整详情（列表页不返回 payment_details）
        const res = await this.$http.get(`/tuition-payment/${row.id}/`)
        const detail = res.data || res

        this.editForm = {
          id: detail.id,
          student_no: detail.student_no || '',
          student_name: detail.student_name || '',
          invoice_no: detail.invoice_no || '',
          tuition_period: detail.tuition_period || '',
          tuitionPeriodRange: this.parsePeriodString(detail.tuition_period),
          tuition_days: numeric(detail.tuition_days),
          grade: detail.grade || '',
          base_tuition: numeric(detail.base_tuition),
          registration_fee: numeric(detail.registration_fee),
          family_discount: numeric(detail.family_discount),
          other_discount: numeric(detail.other_discount),
          tuition_payable: numeric(detail.tuition_payable),
          bus_fee_period: detail.bus_fee_period || '',
          busFeePeriodRange: this.parsePeriodString(detail.bus_fee_period),
          school_bus_fee: numeric(detail.school_bus_fee),
          dormitory_period: detail.dormitory_period || '',
          dormitoryPeriodRange: this.parsePeriodString(detail.dormitory_period),
          dormitory_fee: numeric(detail.dormitory_fee),
          // 已删除字段不再从后端读取，由 calculateEditBalance 本地计算汇总
          samsung_special_remark: detail.samsung_special_remark || '',
          remark: detail.remark || '',
          tuition_pdf_url: detail.tuition_pdf_url || '',
          payment_details: (detail.payment_details || []).map(d => ({
            id: d.id,
            payment_type: d.payment_type || 'tuition',
            amount: numeric(d.amount),
            voucher_no: d.voucher_no || '',
            paid_date: d.paid_date || '',
            payer_name: d.payer_name || '',
            card_no: d.card_no || '',
            bank_name: d.bank_name || '',
            invoice_number: d.invoice_number || '',
            invoice_amount: numeric(d.invoice_amount),
            invoice_content: d.invoice_content || '',
            remark: d.remark || ''
          }))
        }
        this.calculateEditBalance()
        this.editDialogVisible = true
        this.$nextTick(() => {
          this.$refs.editForm && this.$refs.editForm.clearValidate()
        })
      } catch (error) {
        console.error('获取详情失败:', error)
        this.$message.error('获取详情失败')
      }
    },

    // 添加付款明细（使用新数组触发响应式更新）
    addPaymentDetail() {
      this.editForm.payment_details = [
        ...this.editForm.payment_details,
        {
          payment_type: 'tuition',
          amount: undefined,
          voucher_no: '',
          paid_date: '',
          payer_name: '',
          card_no: '',
          bank_name: '',
          invoice_number: '',
          invoice_amount: undefined,
          invoice_content: '',
          remark: ''
        }
      ]
      this.calculateEditBalance()
    },

    // 删除付款明细
    removePaymentDetail(index) {
      this.editForm.payment_details = this.editForm.payment_details.filter((_, i) => i !== index)
      this.calculateEditBalance()
    },

    // 查看付款明细
    async handleViewPaymentDetails(row) {
      try {
        const res = await this.$http.get(`/tuition-payment/${row.id}/`)
        const data = res.data || res
        this.currentPaymentDetails = data.payment_details || []
        this.currentPaymentDetailStudent = data.student_name || data.student_no || '未知学生'
        this.paymentDetailDialogVisible = true
      } catch (error) {
        console.error('获取付款明细失败:', error)
        this.$message.error('获取付款明细失败')
      }
    },

    // 计算编辑表单中的欠款（从付款明细汇总）
    calculateEditBalance() {
      const tuition = parseFloat(this.editForm.tuition_payable) || 0
      const bus = parseFloat(this.editForm.school_bus_fee) || 0
      const dorm = parseFloat(this.editForm.dormitory_fee) || 0

      let paidTuition = 0
      let paidBus = 0
      let paidDorm = 0
      ;(this.editForm.payment_details || []).forEach(d => {
        const amt = parseFloat(d.amount) || 0
        if (d.payment_type === 'tuition') paidTuition += amt
        else if (d.payment_type === 'bus') paidBus += amt
        else if (d.payment_type === 'dormitory') paidDorm += amt
      })

      // 同步到主表字段（用于兼容列表展示）
      this.editForm.paid_tuition_fee = paidTuition.toFixed(2)
      this.editForm.paid_bus_fee = paidBus.toFixed(2)
      this.editForm.paid_dormitory_fee = paidDorm.toFixed(2)

      const totalPaid = paidTuition + paidBus + paidDorm
      this.editForm.balance_due = (tuition + bus + dorm - totalPaid).toFixed(2)
      this.editForm.actual_paid_amount = totalPaid.toFixed(2)
    },

    // 解析期间字符串为日期数组，格式：2026.8.17-2026.6.18
    parsePeriodString(periodStr) {
      if (!periodStr) return []
      const parts = periodStr.split('-')
      if (parts.length !== 2) return []
      const start = this.parseDotDate(parts[0])
      const end = this.parseDotDate(parts[1])
      return start && end ? [start, end] : []
    },

    // 解析点号日期格式 2026.8.17 → 2026-08-17
    parseDotDate(str) {
      if (!str) return null
      const parts = str.trim().split('.')
      if (parts.length !== 3) return null
      const [y, m, d] = parts.map(Number)
      if (!y || !m || !d) return null
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    },

    // 格式化日期数组为点号字符串
    formatPeriodString(dateArr) {
      if (!dateArr || dateArr.length !== 2) return null
      const start = this.formatDotDate(dateArr[0])
      const end = this.formatDotDate(dateArr[1])
      return start && end ? `${start}-${end}` : null
    },

    // 格式化 yyyy-MM-dd → yyyy.M.d
    formatDotDate(dateStr) {
      if (!dateStr) return null
      const parts = dateStr.split('-')
      if (parts.length !== 3) return null
      const [y, m, d] = parts.map(Number)
      return `${y}.${m}.${d}`
    },

    // 日期范围选择器变化处理
    handlePeriodChange(type, val) {
      if (type === 'tuition') {
        this.editForm.tuition_period = this.formatPeriodString(val)
      } else if (type === 'bus') {
        this.editForm.bus_fee_period = this.formatPeriodString(val)
      } else if (type === 'dormitory') {
        this.editForm.dormitory_period = this.formatPeriodString(val)
      }
    },

    // 提交编辑
    async submitEdit() {
      this.editLoading = true
      try {
        // 构造付款明细数据（剔除空值字段，保留 id 用于更新已有记录）
        const paymentDetails = (this.editForm.payment_details || []).map(d => {
          const item = {
            payment_type: d.payment_type || 'tuition',
            amount: d.amount != null && d.amount !== '' && !isNaN(d.amount) ? parseFloat(d.amount) : 0,
            voucher_no: d.voucher_no || null,
            paid_date: d.paid_date || null,
            payer_name: d.payer_name || null,
            card_no: d.card_no || null,
            bank_name: d.bank_name || null,
            invoice_number: d.invoice_number || null,
            invoice_amount: d.invoice_amount != null ? parseFloat(d.invoice_amount) : null,
            invoice_content: d.invoice_content || null,
            remark: d.remark || null
          }
          if (d.id) {
            item.id = d.id
          }
          return item
        })

        const payload = {
          student_no: this.editForm.student_no || null,
          student_name: this.editForm.student_name || null,
          invoice_no: this.editForm.invoice_no || null,
          tuition_period: this.editForm.tuition_period || null,
          tuition_days: this.editForm.tuition_days || 0,
          grade: this.editForm.grade || null,
          base_tuition: this.editForm.base_tuition || 0,
          registration_fee: this.editForm.registration_fee || 0,
          family_discount: this.editForm.family_discount || 0,
          other_discount: this.editForm.other_discount || 0,
          tuition_payable: this.editForm.tuition_payable || 0,
          bus_fee_period: this.editForm.bus_fee_period || null,
          school_bus_fee: this.editForm.school_bus_fee || 0,
          dormitory_period: this.editForm.dormitory_period || null,
          dormitory_fee: this.editForm.dormitory_fee || 0,
          // 主表已删除字段不再提交，付款明细已包含相关信息
          samsung_special_remark: this.editForm.samsung_special_remark || null,
          remark: this.editForm.remark || null,
          payment_details: paymentDetails
        }
        if (this.isEdit) {
          await this.$http.put(`/tuition-payment/${this.editForm.id}/`, payload)
          this.$message.success('更新成功')
        } else {
          await this.$http.post('/tuition-payment/', payload)
          this.$message.success('创建成功')
        }
        this.editDialogVisible = false
        this.loadRecordList()
      } catch (error) {
        console.error('更新失败:', error)
        this.$message.error('更新失败')
      } finally {
        this.editLoading = false
      }
    },

    // 删除记录
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该缴费记录?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await this.$http.delete(`/tuition-payment/${row.id}/`)
        this.$message.success('删除成功')
        this.loadRecordList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          this.$message.error('删除失败')
        }
      }
    },

    // 打开导出对话框
    handleExport() {
      this.exportAcademicYear = this.queryParams.academic_year || ''
      this.exportGrades = []
      this.exportDialogVisible = true
    },

    // 提交导出
    async submitExport() {
      if (!this.exportAcademicYear) {
        this.$message.warning('请选择学年')
        return
      }
      try {
        this.$message.info('正在导出，请稍候...')
        const params = { academic_year: this.exportAcademicYear }
        if (this.exportGrades && this.exportGrades.length > 0) {
          params.grades = this.exportGrades.join(',')
        }
        const res = await exportTuitionPayment(params)

        // 创建下载链接
        const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        let gradeSuffix = ''
        if (this.exportGrades && this.exportGrades.length > 0) {
          const names = this.exportGrades.slice(0, 3).join('_')
          gradeSuffix = this.exportGrades.length > 3
            ? `_${names}等${this.exportGrades.length}个年级`
            : `_${names}`
        }
        link.download = `学费统计_${this.exportAcademicYear}${gradeSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)

        this.exportDialogVisible = false
        this.$message.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败')
      }
    },

    // 金额格式化
    formatMoney(value) {
      if (!value && value !== 0) return '0.00'
      return parseFloat(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  height: calc(100vh - 84px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.filter-container {
  .el-form-item {
    margin-bottom: 10px;
  }
}

.operate-container {
  .table-operation {
    display: flex;
    gap: 10px;
  }
}

.table-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-bottom: 0 !important;
  ::v-deep .el-card__body {
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .el-table {
    font-size: 13px;
  }
}

.pagination-container {
  padding: 10px 0;
  text-align: right;
  background: #fff;
  border-top: 1px solid #ebeef5;
}

.readonly-field {
  line-height: 36px;
  padding: 0 15px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
}

.readonly-field.highlight {
  color: #f56c6c;
  font-weight: bold;
  background-color: #fef0f0;
  border-color: #fde2e2;
}

.pdf-preview-container {
  position: relative;
  width: 100%;
  height: 520px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background-color: #f5f7fa;

  .pdf-preview-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
  }

  .pdf-preview-filename {
    margin-top: 12px;
    font-size: 14px;
    color: #606266;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pdf-zoom-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.35);
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 14px;
    cursor: pointer;
  }

  &:hover .pdf-zoom-overlay {
    opacity: 1;
  }
}

.pdf-placeholder {
  width: 100%;
  height: 520px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}
</style>
