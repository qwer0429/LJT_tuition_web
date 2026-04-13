<template>
  <div class="app-container">
    <!-- 统计概览卡片 -->
    <el-row :gutter="20" class="statistics-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409EFF;">
            <i class="el-icon-s-finance" />
          </div>
          <div class="stat-info">
            <div class="stat-label">应付学费总额</div>
            <div class="stat-value" style="color: #409EFF;">¥ {{ formatMoney(statistics.tuition?.payable) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67C23A;">
            <i class="el-icon-check" />
          </div>
          <div class="stat-info">
            <div class="stat-label">已付学费总额</div>
            <div class="stat-value" style="color: #67C23A;">¥ {{ formatMoney(statistics.tuition?.paid) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #E6A23C;">
            <i class="el-icon-time" />
          </div>
          <div class="stat-info">
            <div class="stat-label">学费欠款总额</div>
            <div class="stat-value" style="color: #E6A23C;">¥ {{ formatMoney(statistics.tuition?.unpaid) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #F56C6C;">
            <i class="el-icon-document" />
          </div>
          <div class="stat-info">
            <div class="stat-label">记录总数</div>
            <div class="stat-value" style="color: #F56C6C;">{{ statistics.record_count || 0 }} 条</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 更多统计信息 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="never">
          <div slot="header">校车费统计</div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="应付">¥ {{ formatMoney(statistics.bus_fee?.payable) }}</el-descriptions-item>
            <el-descriptions-item label="已付">¥ {{ formatMoney(statistics.bus_fee?.paid) }}</el-descriptions-item>
            <el-descriptions-item label="欠款">
              <span :style="statistics.bus_fee?.unpaid > 0 ? 'color: #F56C6C; font-weight: bold;' : ''">
                ¥ {{ formatMoney(statistics.bus_fee?.unpaid) }}
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <div slot="header">宿舍费统计</div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="应付">¥ {{ formatMoney(statistics.dormitory_fee?.payable) }}</el-descriptions-item>
            <el-descriptions-item label="已付">¥ {{ formatMoney(statistics.dormitory_fee?.paid) }}</el-descriptions-item>
            <el-descriptions-item label="欠款">
              <span :style="statistics.dormitory_fee?.unpaid > 0 ? 'color: #F56C6C; font-weight: bold;' : ''">
                ¥ {{ formatMoney(statistics.dormitory_fee?.unpaid) }}
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选栏 -->
    <el-card shadow="never" style="margin-top: 20px;">
      <div slot="header">缴费记录查询</div>
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="学年：">
          <el-select v-model="queryParams.academic_year" placeholder="请选择学年" clearable style="width: 150px;" @change="handleQuery">
            <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级：">
          <el-select v-model="queryParams.grade" placeholder="请选择年级" clearable style="width: 120px;" @change="handleQuery">
            <el-option v-for="grade in gradeOptions" :key="grade" :label="grade" :value="grade" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款状态：">
          <el-select v-model="queryParams.payment_status" placeholder="全部" clearable style="width: 120px;" @change="handleQuery">
            <el-option label="已付清" value="paid" />
            <el-option label="有欠款" value="unpaid" />
          </el-select>
        </el-form-item>
        <el-form-item label="家庭编号：">
          <el-input v-model="queryParams.invoice_no" placeholder="请输入" clearable style="width: 150px;" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="学生姓名：">
          <el-input v-model="queryParams.student_name" placeholder="请输入" clearable style="width: 150px;" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" style="margin-top: 20px;">
      <div slot="header">
        <span>缴费记录列表</span>
        <div style="float: right;">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">新增记录</el-button>
          <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">导出</el-button>
        </div>
      </div>
      <el-table
        v-loading="loading"
        :data="recordList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学生信息" min-width="180">
          <template slot-scope="scope">
            <div style="font-weight: bold;">{{ scope.row.student_name }}</div>
            <div style="color: #909399; font-size: 12px;">学号: {{ scope.row.student_no }}</div>
            <div style="color: #909399; font-size: 12px;">家庭: {{ scope.row.invoice_no }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" align="center" width="80" />
        <el-table-column prop="tuition_period" label="学费期间" align="center" width="120" />
        <el-table-column label="应付学费" align="right" width="120">
          <template slot-scope="scope">
            ¥ {{ formatMoney(scope.row.tuition_payable) }}
          </template>
        </el-table-column>
        <el-table-column label="已付学费" align="right" width="120">
          <template slot-scope="scope">
            ¥ {{ formatMoney(scope.row.paid_tuition_fee) }}
          </template>
        </el-table-column>
        <el-table-column label="欠款" align="right" width="120">
          <template slot-scope="scope">
            <span :style="scope.row.balance_due > 0 ? 'color: #F56C6C; font-weight: bold;' : ''">
              ¥ {{ formatMoney(scope.row.balance_due) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="校车费" align="right" width="100">
          <template slot-scope="scope">
            ¥ {{ formatMoney(scope.row.school_bus_fee) }}
          </template>
        </el-table-column>
        <el-table-column label="宿舍费" align="right" width="100">
          <template slot-scope="scope">
            ¥ {{ formatMoney(scope.row.dormitory_fee) }}
          </template>
        </el-table-column>
        <el-table-column label="付款日期" align="center" width="100">
          <template slot-scope="scope">
            {{ scope.row.paid_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" style="color: #F56C6C;" @click="handleDelete(scope.row)">删除</el-button>
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
  </div>
</template>

<script>
import { 
  getTuitionPaymentList, 
  getTuitionPaymentStatistics, 
  getTuitionPaymentGrades,
  deleteTuitionPayment 
} from '@/api/tuitionPayment'
import { getAcademicYears } from '@/api/student'

export default {
  name: 'TuitionPayment',
  data() {
    return {
      loading: false,
      statistics: {
        record_count: 0,
        tuition: { payable: 0, paid: 0, unpaid: 0 },
        bus_fee: { payable: 0, paid: 0, unpaid: 0 },
        dormitory_fee: { payable: 0, paid: 0, unpaid: 0 }
      },
      recordList: [],
      total: 0,
      queryParams: {
        page: 1,
        page_size: 20,
        academic_year: '',
        grade: '',
        payment_status: '',
        invoice_no: '',
        student_name: ''
      },
      academicYearOptions: [],
      gradeOptions: []
    }
  },
  created() {
    this.initData()
  },
  methods: {
    // 初始化数据
    async initData() {
      await Promise.all([
        this.loadAcademicYears(),
        this.loadGrades(),
        this.loadStatistics(),
        this.loadRecordList()
      ])
    },

    // 加载学年选项
    async loadAcademicYears() {
      try {
        const res = await getAcademicYears()
        this.academicYearOptions = res.data || []
        if (this.academicYearOptions.length > 0 && !this.queryParams.academic_year) {
          this.queryParams.academic_year = this.academicYearOptions[0]
        }
      } catch (error) {
        console.error('加载学年失败:', error)
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

    // 加载统计信息
    async loadStatistics() {
      try {
        const res = await getTuitionPaymentStatistics()
        if (res.code === 1 || res.code === 200) {
          this.statistics = res.data || this.statistics
        }
      } catch (error) {
        console.error('加载统计信息失败:', error)
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
            this.recordList = res.data
            this.total = res.data.length
          } else if (res.data && Array.isArray(res.data.results)) {
            this.recordList = res.data.results
            this.total = res.data.count || res.data.results.length
          } else {
            this.recordList = []
            this.total = 0
          }
        }
      } catch (error) {
        console.error('加载记录列表失败:', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
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
        academic_year: this.academicYearOptions[0] || '',
        grade: '',
        payment_status: '',
        invoice_no: '',
        student_name: ''
      }
      this.handleQuery()
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

    // 新增
    handleAdd() {
      this.$message.info('新增功能开发中...')
    },

    // 编辑
    handleEdit(row) {
      this.$message.info('编辑功能开发中...')
      console.log('编辑行:', row)
    },

    // 删除
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该记录吗？', '提示', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await deleteTuitionPayment(row.id)
        this.$message.success('删除成功')
        this.loadRecordList()
        this.loadStatistics()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
          console.error('删除失败:', error)
        }
      }
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
.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  
  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    
    i {
      font-size: 28px;
      color: #fff;
    }
  }
  
  .stat-info {
    flex: 1;
    
    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }
  }
}
</style>
