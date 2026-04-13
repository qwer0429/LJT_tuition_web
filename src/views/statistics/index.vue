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
        :max-height="tableHeight"
      >
        <el-table-column label="学生" align="center" min-width="180">
          <template slot-scope="scope">
            <div style="font-weight: bold;">{{ scope.row.student_name }}</div>
            <div style="color: #909399; font-size: 12px;">学号: {{ scope.row.student_no }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" align="center" width="80" />
        <el-table-column prop="invoice_no" label="家庭编号" align="center" min-width="140" />
        <el-table-column prop="tuition_period" label="学年" align="center" width="120" />
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
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryParams.page_size"
          :current-page="queryParams.page"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog title="缴费详情" :visible.sync="detailDialogVisible" width="700px">
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="学生姓名">{{ currentRow.student_name }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ currentRow.student_no }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ currentRow.grade }}</el-descriptions-item>
        <el-descriptions-item label="家庭编号">{{ currentRow.invoice_no }}</el-descriptions-item>
        <el-descriptions-item label="学费期间">{{ currentRow.tuition_period }}</el-descriptions-item>
        <el-descriptions-item label="标准学费">¥{{ formatMoney(currentRow.base_tuition) }}</el-descriptions-item>
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
  </div>
</template>

<script>
import { 
  getTuitionPaymentList, 
  getTuitionPaymentGrades 
} from '@/api/tuitionPayment'

export default {
  name: 'TuitionStatistics',
  data() {
    return {
      loading: false,
      queryParams: {
        page: 1,
        page_size: 20,
        academic_year: '',
        grade: '',
        payment_status: '',
        invoice_no: '',
        search: ''
      },
      academicYearOptions: ['2023-2024学年', '2024-2025学年', '2025-2026学年'],
      gradeOptions: [],
      familyOptions: [],
      recordList: [],
      total: 0,
      tableHeight: 600,
      detailDialogVisible: false,
      currentRow: null
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
      this.tableHeight = windowHeight - 320
    },

    // 初始化数据
    async initData() {
      await this.loadGrades()
      this.loadRecordList()
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
        if (res.code === 1 || res.code === 200) {
          // 处理分页数据
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
          
          // 提取家庭编号选项
          this.familyOptions = [...new Set(this.recordList.map(r => r.invoice_no).filter(Boolean))]
        }
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
      this.detailDialogVisible = true
    },

    // 导出
    handleExport() {
      this.$message.info('导出功能开发中...')
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
  .el-table {
    font-size: 13px;
  }
}
</style>
