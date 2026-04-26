<template>
  <div class="app-container">
    <!-- 筛选栏 -->
    <el-card class="filter-container" shadow="never">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="家庭编号：" style="width: 100%;">
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
              <el-select v-model="queryParams.academic_year" placeholder="全部" clearable style="width: 100%;" @change="handleQuery">
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
        <el-button type="success" icon="el-icon-download" @click="handleExport">导出数据</el-button>
        <el-button icon="el-icon-refresh" @click="refreshData">刷新</el-button>
      </div>
    </el-card>

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
        <el-table-column label="学费" align="right" min-width="120">
          <template slot-scope="scope">
            <div>应付: ¥{{ formatMoney(scope.row.tuition_payable) }}</div>
            <div>已付: ¥{{ formatMoney(scope.row.paid_tuition_fee) }}</div>
            <div v-if="(scope.row.tuition_payable - scope.row.paid_tuition_fee) > 0" style="color: #F56C6C; font-size: 12px;">
              欠: ¥{{ formatMoney(scope.row.tuition_payable - scope.row.paid_tuition_fee) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="校车费" align="right" width="100">
          <template slot-scope="scope">
            <div v-if="scope.row.school_bus_fee > 0">
              ¥{{ formatMoney(scope.row.school_bus_fee) }}
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        <el-table-column label="宿舍费" align="right" width="100">
          <template slot-scope="scope">
            <div v-if="scope.row.dormitory_fee > 0">
              ¥{{ formatMoney(scope.row.dormitory_fee) }}
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
            <span :style="scope.row.balance_due > 0 ? 'color: #F56C6C; font-weight: bold;' : ''">
              ¥{{ formatMoney(scope.row.balance_due) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="paid_date" label="付款日期" align="center" width="100">
          <template slot-scope="scope">
            {{ scope.row.paid_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="payer_name" label="付款方" align="center" min-width="120" />
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row)">查看</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog title="缴费详情" :visible.sync="detailDialogVisible" width="700px">
      <div v-if="currentRow" style="text-align: right; margin-bottom: 15px;">
        <el-button
          v-if="currentRow.tuition_pdf_url"
          type="primary"
          size="small"
          icon="el-icon-view"
          @click="openPdfZoom"
        >
          查看学费单
        </el-button>
        <el-button v-else type="info" size="small" disabled icon="el-icon-document">暂无学费单PDF</el-button>
      </div>
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="学生姓名">{{ currentRow.student_name }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ currentRow.student_no }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ currentRow.grade }}</el-descriptions-item>
        <el-descriptions-item label="家庭编号">{{ currentRow.invoice_no }}</el-descriptions-item>
        <el-descriptions-item label="学费期间">{{ currentRow.tuition_period }}</el-descriptions-item>
        <el-descriptions-item label="学费期间天数">{{ currentRow.tuition_days || '-' }}</el-descriptions-item>
        <el-descriptions-item label="标准学费">¥{{ formatMoney(currentRow.base_tuition) }}</el-descriptions-item>
        <el-descriptions-item label="家庭折扣">
          <span v-if="currentRow.family_discount > 0" style="color: #E6A23C;">¥{{ formatMoney(currentRow.family_discount) }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="其他折扣">
          <span v-if="currentRow.other_discount > 0" style="color: #E6A23C;">¥{{ formatMoney(currentRow.other_discount) }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="应付学费">¥{{ formatMoney(currentRow.tuition_payable) }}</el-descriptions-item>
        <el-descriptions-item label="已付学费">¥{{ formatMoney(currentRow.paid_tuition_fee) }}</el-descriptions-item>
        <el-descriptions-item label="校车费">¥{{ formatMoney(currentRow.school_bus_fee) }}</el-descriptions-item>
        <el-descriptions-item label="已付校车费">¥{{ formatMoney(currentRow.paid_bus_fee) }}</el-descriptions-item>
        <el-descriptions-item label="宿舍费">¥{{ formatMoney(currentRow.dormitory_fee) }}</el-descriptions-item>
        <el-descriptions-item label="已付宿舍费">¥{{ formatMoney(currentRow.paid_dormitory_fee) }}</el-descriptions-item>
        <el-descriptions-item label="应付总额" :span="2">
          <span style="font-weight: bold; font-size: 16px;">¥{{ formatMoney(currentRow.total_payable) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="已付总额" :span="2">
          <span style="color: #67C23A; font-weight: bold; font-size: 16px;">¥{{ formatMoney(currentRow.total_paid) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="欠款金额" :span="2">
          <span :style="currentRow.balance_due > 0 ? 'color: #F56C6C; font-weight: bold; font-size: 16px;' : ''">
            ¥{{ formatMoney(currentRow.balance_due) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="付款日期">{{ currentRow.paid_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="付款方">{{ currentRow.payer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="凭证号(学费)">{{ currentRow.tuition_voucher_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="凭证号(校车)">{{ currentRow.bus_voucher_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发票号码">{{ currentRow.invoice_number || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发票金额">¥{{ formatMoney(currentRow.invoice_amount) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog title="编辑缴费记录" :visible.sync="editDialogVisible" width="900px">
      <el-form ref="editForm" :model="editForm" label-width="130px">
        <!-- 基础信息 -->
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="序号">
              <el-input-number v-model="editForm.seq_no" :min="0" :precision="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学生姓名">
              <el-input v-model="editForm.student_name" placeholder="请输入学生姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学号">
              <el-input v-model="editForm.student_no" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="家庭编号">
              <el-input v-model="editForm.invoice_no" placeholder="请输入家庭编号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学费期间">
              <el-input v-model="editForm.tuition_period" placeholder="如：2026-08-17~2027-06-18" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年级">
              <el-input v-model="editForm.grade" placeholder="请输入年级" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 学费信息 -->
        <el-divider content-position="left">学费信息（由学费单生成，只读）</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="学费期间天数">
              <div class="readonly-field">{{ editForm.tuition_days || '-' }} 天</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="标准学费">
              <div class="readonly-field">¥{{ formatMoney(editForm.base_tuition) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="注册费">
              <div class="readonly-field">¥{{ formatMoney(editForm.registration_fee) }}</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="家庭折扣">
              <div class="readonly-field">¥{{ formatMoney(editForm.family_discount) }}</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="其他折扣">
              <div class="readonly-field">¥{{ formatMoney(editForm.other_discount) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="应付学费">
              <div class="readonly-field highlight">¥{{ formatMoney(editForm.tuition_payable) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="已付学费">
              <el-input-number v-model="editForm.paid_tuition_fee" :min="0" :precision="2" :controls="false" style="width: 100%;" @change="calculateEditBalance" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 校车费信息 -->
        <el-divider content-position="left">校车费信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="校车费期间">
              <el-input v-model="editForm.bus_fee_period" placeholder="请输入校车费期间" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="校车费">
              <el-input-number v-model="editForm.school_bus_fee" :min="0" :precision="2" :controls="false" style="width: 100%;" @change="calculateEditBalance" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="已付校车费">
              <el-input-number v-model="editForm.paid_bus_fee" :min="0" :precision="2" :controls="false" style="width: 100%;" @change="calculateEditBalance" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="凭证号(校车)">
              <el-input v-model="editForm.bus_voucher_no" placeholder="请输入凭证号" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 宿舍费信息 -->
        <el-divider content-position="left">宿舍费信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="住宿费期间">
              <el-input v-model="editForm.dormitory_period" placeholder="请输入住宿费期间" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="宿舍费">
              <el-input-number v-model="editForm.dormitory_fee" :min="0" :precision="2" :controls="false" style="width: 100%;" @change="calculateEditBalance" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="已付宿舍费">
              <el-input-number v-model="editForm.paid_dormitory_fee" :min="0" :precision="2" :controls="false" style="width: 100%;" @change="calculateEditBalance" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="凭证号(宿舍)">
              <el-input v-model="editForm.dormitory_voucher_no" placeholder="请输入凭证号" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 付款与欠款 -->
        <el-divider content-position="left">付款与欠款</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="付款日期">
              <el-date-picker v-model="editForm.paid_date" type="date" placeholder="选择日期" value-format="yyyy-MM-dd" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="欠款">
              <div class="readonly-field" :style="editForm.balance_due > 0 ? 'color: #F56C6C; font-weight: bold;' : ''">¥{{ formatMoney(editForm.balance_due) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="实付金额">
              <div class="readonly-field highlight">¥{{ formatMoney(editForm.actual_paid_amount) }}</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="付款方">
              <el-input v-model="editForm.payer_name" placeholder="请输入付款方" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="卡号">
              <el-input v-model="editForm.card_no" placeholder="请输入卡号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="银行">
              <el-input v-model="editForm.bank_name" placeholder="请输入银行" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 发票信息 -->
        <el-divider content-position="left">发票信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="发票号码">
              <el-input v-model="editForm.invoice_number" placeholder="请输入发票号码" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开票金额">
              <el-input-number v-model="editForm.invoice_amount" :min="0" :precision="2" :controls="false" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="发票内容">
              <el-input v-model="editForm.invoice_content" placeholder="请输入发票内容" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 凭证号(学费) -->
        <el-divider content-position="left">凭证信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="凭证号(学费)">
              <el-input v-model="editForm.tuition_voucher_no" placeholder="请输入凭证号" />
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

    <!-- 导出对话框 -->
    <el-dialog title="导出学费统计" :visible.sync="exportDialogVisible" width="400px">
      <el-form label-width="80px">
        <el-form-item label="学年">
          <el-select v-model="exportAcademicYear" placeholder="请选择学年" style="width: 100%;">
            <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
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
      tableHeight: 600,
      detailDialogVisible: false,
      currentRow: null,
      pdfZoomDialogVisible: false,
      zoomPdfUrl: '',
      editDialogVisible: false,
      editLoading: false,
      exportDialogVisible: false,
      exportAcademicYear: '',
      editForm: {
        id: null,
        seq_no: null,
        student_no: '',
        student_name: '',
        invoice_no: '',
        tuition_period: '',
        grade: '',
        base_tuition: 0,
        registration_fee: 0,
        family_discount: 0,
        other_discount: 0,
        tuition_payable: 0,
        tuition_days: 0,
        bus_fee_period: '',
        school_bus_fee: 0,
        dormitory_period: '',
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
        remark: ''
      }
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
        
        // 提取家庭编号选项
        this.familyOptions = [...new Set(this.recordList.map(r => r.invoice_no).filter(Boolean))]
      } catch (error) {
        console.error('加载记录列表失败:', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },

    // 处理记录数据，添加计算字段
    processRecord(record) {
      const tuitionPayable = parseFloat(record.tuition_payable) || 0
      const busFee = parseFloat(record.school_bus_fee) || 0
      const dormFee = parseFloat(record.dormitory_fee) || 0
      const tuitionPaid = parseFloat(record.paid_tuition_fee) || 0
      const busPaid = parseFloat(record.paid_bus_fee) || 0
      const dormPaid = parseFloat(record.paid_dormitory_fee) || 0
      
      return {
        ...record,
        total_payable: tuitionPayable + busFee + dormFee,
        total_paid: tuitionPaid + busPaid + dormPaid
      }
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

    // 查看详情
    handleView(row) {
      this.currentRow = row
      console.log('[PDF Debug] tuition_pdf_url:', row.tuition_pdf_url, 'tuition_pdf:', row.tuition_pdf)
      this.detailDialogVisible = true
    },

    // 打开放大PDF
    openPdfZoom() {
      if (this.currentRow && this.currentRow.tuition_pdf_url) {
        window.open(this.currentRow.tuition_pdf_url, '_blank')
      }
    },

    // 获取PDF文件名
    getPdfFilename(url) {
      if (!url) return ''
      const parts = url.split('/')
      return parts[parts.length - 1] || '学费单.pdf'
    },

    // 打开编辑对话框
    handleEdit(row) {
      const numeric = (val) => parseFloat(val) || 0
      this.editForm = {
        id: row.id,
        seq_no: row.seq_no || null,
        student_no: row.student_no || '',
        student_name: row.student_name || '',
        invoice_no: row.invoice_no || '',
        tuition_period: row.tuition_period || '',
        tuition_days: numeric(row.tuition_days),
        grade: row.grade || '',
        base_tuition: numeric(row.base_tuition),
        registration_fee: numeric(row.registration_fee),
        family_discount: numeric(row.family_discount),
        other_discount: numeric(row.other_discount),
        tuition_payable: numeric(row.tuition_payable),
        bus_fee_period: row.bus_fee_period || '',
        school_bus_fee: numeric(row.school_bus_fee),
        dormitory_period: row.dormitory_period || '',
        dormitory_fee: numeric(row.dormitory_fee),
        tuition_voucher_no: row.tuition_voucher_no || '',
        paid_tuition_fee: numeric(row.paid_tuition_fee),
        bus_voucher_no: row.bus_voucher_no || '',
        paid_bus_fee: numeric(row.paid_bus_fee),
        dormitory_voucher_no: row.dormitory_voucher_no || '',
        paid_dormitory_fee: numeric(row.paid_dormitory_fee),
        paid_date: row.paid_date || '',
        balance_due: numeric(row.balance_due),
        actual_paid_amount: numeric(row.actual_paid_amount),
        payer_name: row.payer_name || '',
        card_no: row.card_no || '',
        bank_name: row.bank_name || '',
        invoice_number: row.invoice_number || '',
        invoice_amount: numeric(row.invoice_amount),
        invoice_content: row.invoice_content || '',
        samsung_special_remark: row.samsung_special_remark || '',
        remark: row.remark || ''
      }
      this.editDialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },

    // 计算编辑表单中的欠款
    calculateEditBalance() {
      const tuition = parseFloat(this.editForm.tuition_payable) || 0
      const bus = parseFloat(this.editForm.school_bus_fee) || 0
      const dorm = parseFloat(this.editForm.dormitory_fee) || 0
      const paidTuition = parseFloat(this.editForm.paid_tuition_fee) || 0
      const paidBus = parseFloat(this.editForm.paid_bus_fee) || 0
      const paidDorm = parseFloat(this.editForm.paid_dormitory_fee) || 0
      this.editForm.balance_due = (tuition + bus + dorm - paidTuition - paidBus - paidDorm).toFixed(2)
      this.editForm.actual_paid_amount = (paidTuition + paidBus + paidDorm).toFixed(2)
    },

    // 提交编辑
    async submitEdit() {
      this.editLoading = true
      try {
        const payload = {
          seq_no: this.editForm.seq_no || null,
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
          tuition_voucher_no: this.editForm.tuition_voucher_no || null,
          paid_tuition_fee: this.editForm.paid_tuition_fee || 0,
          bus_voucher_no: this.editForm.bus_voucher_no || null,
          paid_bus_fee: this.editForm.paid_bus_fee || 0,
          dormitory_voucher_no: this.editForm.dormitory_voucher_no || null,
          paid_dormitory_fee: this.editForm.paid_dormitory_fee || 0,
          paid_date: this.editForm.paid_date || null,
          balance_due: this.editForm.balance_due || 0,
          actual_paid_amount: this.editForm.actual_paid_amount || 0,
          payer_name: this.editForm.payer_name || null,
          card_no: this.editForm.card_no || null,
          bank_name: this.editForm.bank_name || null,
          invoice_number: this.editForm.invoice_number || null,
          invoice_amount: this.editForm.invoice_amount || 0,
          invoice_content: this.editForm.invoice_content || null,
          samsung_special_remark: this.editForm.samsung_special_remark || null,
          remark: this.editForm.remark || null
        }
        await this.$http.put(`/tuition-payment/${this.editForm.id}/`, payload)
        this.$message.success('更新成功')
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
        const res = await exportTuitionPayment({ academic_year: this.exportAcademicYear })
        
        // 创建下载链接
        const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `学费统计_${this.exportAcademicYear}_${new Date().toISOString().slice(0, 10)}.xlsx`
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
