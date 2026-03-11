<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <div class="filter-container search-header">
      <el-input
        v-model="listQuery.academic_year"
        placeholder="学年"
        style="width: 150px;"
        class="filter-item"
        clearable
      />
      <el-button type="primary" icon="el-icon-search" @click="getList">查询</el-button>
      <el-button type="success" icon="el-icon-plus" @click="handleCreate">新增校历</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      ref="calendarTable"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @expand-change="handleExpandChange"
    >
      <el-table-column type="expand">
        <template slot-scope="scope">
          <div style="padding: 10px; background: #f5f7fa;">
            <div style="margin-bottom: 10px; font-weight: bold; color: #606266;">
              <i class="el-icon-date" /> {{ scope.row.academic_year }} 月度明细
              <el-button type="primary" size="mini" icon="el-icon-plus" style="margin-left: 10px;" @click="handleAddMonth(scope.row)">新增月份</el-button>
              <el-button type="success" size="mini" icon="el-icon-refresh" style="margin-left: 5px;" @click="handleGenerateMonths(scope.row)">自动生成</el-button>
            </div>
            <el-table :data="scope.row.months || []" border size="small" style="width: 100%;">
              <el-table-column label="月份" align="center" width="80">
                <template slot-scope="monthScope">
                  {{ formatYearMonth(monthScope.row) }}
                </template>
              </el-table-column>
              <el-table-column label="工作日天数" align="center" width="100">
                <template slot-scope="monthScope">
                  <span style="font-weight: bold; color: #409eff;">{{ monthScope.row.working_days_in_month }}</span><span style="color: #909399; margin-left: 3px;">天</span>
                </template>
              </el-table-column>
              <el-table-column label="备注" prop="remark" align="center" show-overflow-tooltip />
              <el-table-column label="操作" align="center" width="120">
                <template slot-scope="monthScope">
                  <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleEditMonth(scope.row, monthScope.row)" />
                  <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDeleteMonth(scope.row, monthScope.row)" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="ID" prop="id" align="center" width="60" />
      <el-table-column label="学年" prop="academic_year" align="center" width="120" />
      <el-table-column label="学年开始日期" prop="year_start_date" align="center" width="130" />
      <el-table-column label="学年结束日期" prop="year_end_date" align="center" width="130" />
      <el-table-column label="总教学日" prop="total_teaching_days" align="center" width="100" />
      <el-table-column label="第一学期教学日" prop="first_semester_teaching_days" align="center" width="120" />
      <el-table-column label="第二学期教学日" prop="second_semester_teaching_days" align="center" width="120" />
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.is_active" type="success">启用</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页信息 -->
    <div v-if="total > 0" style="margin-top: 15px; text-align: right; color: #666;">
      共 {{ total }} 条记录
    </div>

    <!-- 新增/编辑校历对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px">
      <el-form ref="dataForm" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="学年" prop="academic_year">
          <el-input v-model="form.academic_year" placeholder="如：2025-2026" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学年开始日期" prop="year_start_date">
              <el-date-picker
                v-model="form.year_start_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学年结束日期" prop="year_end_date">
              <el-date-picker
                v-model="form.year_end_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">教学日统计</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总教学日">
              <el-input-number v-model="form.total_teaching_days" :min="0" :precision="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="第一学期教学日">
              <el-input-number v-model="form.first_semester_teaching_days" :min="0" :precision="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="第二学期教学日">
              <el-input-number v-model="form.second_semester_teaching_days" :min="0" :precision="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="启用状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>

    <!-- 新增/编辑月度明细对话框 -->
    <el-dialog :title="monthDialogTitle" :visible.sync="monthDialogVisible" width="450px">
      <el-form ref="monthForm" :model="monthForm" :rules="monthRules" label-width="100px">
        <el-form-item label="所属校历">
          <el-input :value="currentCalendarAcademicYear" disabled style="width: 100%;" />
        </el-form-item>
        <el-form-item label="年月" prop="yearMonth">
          <el-date-picker
            v-model="monthForm.yearMonth"
            type="month"
            placeholder="选择年月"
            style="width: 100%;"
            value-format="yyyy-MM"
            @change="handleYearMonthChange"
          />
        </el-form-item>
        <el-form-item label="工作日天数" prop="working_days_in_month">
          <el-slider v-model="monthForm.working_days_in_month" :max="31" show-input style="width: 100%;" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="monthForm.remark" type="textarea" :rows="2" placeholder="可选，记录节假日等特殊情况" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="monthDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMonthForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'SchoolCalendar',
  data() {
    return {
      list: [],
      total: 0,
      listLoading: false,
      tableHeight: 500,
      monthTableHeight: 400,
      listQuery: {
        academic_year: ''
      },
      dialogVisible: false,
      dialogTitle: '',
      form: {
        id: null,
        academic_year: '',
        year_start_date: '',
        year_end_date: '',
        total_teaching_days: 0,
        first_semester_teaching_days: 0,
        second_semester_teaching_days: 0,
        is_active: true
      },
      rules: {
        academic_year: [{ required: true, message: '请输入学年', trigger: 'blur' }],
        year_start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
        year_end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
      },
      // 月度明细相关
      currentCalendar: null,
      monthDialogVisible: false,
      monthDialogTitle: '',
      monthForm: {
        id: null,
        school_calendar: null,
        month: null,
        yearMonth: '',
        month_start_date: '',
        month_end_date: '',
        working_days_in_month: 22,
        remark: ''
      },
      monthRules: {
        yearMonth: [{ required: true, message: '请选择年月', trigger: 'change' }],
        working_days_in_month: [{ required: true, message: '请输入工作日天数', trigger: 'blur' }]
      }
    }
  },
  computed: {
    // 当前校历的学年名称
    currentCalendarAcademicYear() {
      return this.currentCalendar ? this.currentCalendar.academic_year : ''
    }
  },
  created() {
    this.getList()
  },
  mounted() {
    this.getTableHeight()
    window.addEventListener('resize', () => {
      this.getTableHeight()
    })
  },
  methods: {
    getTableHeight() {
      // 主表格高度
      this.tableHeight = window.innerHeight - 180
      // 月度明细子表格高度 - 填满剩余空间
      this.monthTableHeight = window.innerHeight - 350
    },

    // 获取校历列表
    async getList() {
      this.listLoading = true
      try {
        const params = {}
        if (this.listQuery.academic_year) {
          params.academic_year = this.listQuery.academic_year
        }
        const res = await this.$http.get('/schoolcalendar/', { params })

        let dataList = []
        if (Array.isArray(res)) {
          dataList = res
        } else if (res.results && Array.isArray(res.results)) {
          dataList = res.results
        } else if (res.data && Array.isArray(res.data)) {
          dataList = res.data
        }

        this.list = dataList
        this.total = dataList.length

        // 默认展开启用的校历
        this.$nextTick(() => {
          this.expandActiveCalendar()
        })
      } catch (error) {
        console.error('获取校历列表失败:', error)
        this.$message.error('获取校历列表失败')
      } finally {
        this.listLoading = false
      }
    },

    // 展开行时加载月度明细
    async handleExpandChange(row, expandedRows) {
      if (expandedRows.includes(row) && (!row.months || row.months.length === 0)) {
        await this.loadMonths(row)
      }
    },

    // 默认展开启用的校历
    async expandActiveCalendar() {
      // 找到启用的校历
      const activeCalendar = this.list.find(c => c.is_active)
      if (activeCalendar) {
        // 加载月度明细
        await this.loadMonths(activeCalendar)
        // 触发展开（通过设置表格的展开行）
        this.$nextTick(() => {
          const table = this.$refs.calendarTable
          if (table) {
            table.toggleRowExpansion(activeCalendar, true)
          }
        })
      }
    },

    // 加载月度明细
    async loadMonths(calendar) {
      try {
        const res = await this.$http.get('/schoolcalendarmonth/', {
          params: { school_calendar: calendar.id }
        })

        let months = []
        if (Array.isArray(res)) {
          months = res
        } else if (res.results && Array.isArray(res.results)) {
          months = res.results
        } else if (res.data && Array.isArray(res.data)) {
          months = res.data
        }

        this.$set(calendar, 'months', months.sort((a, b) => a.month - b.month))
      } catch (error) {
        console.error('加载月度明细失败:', error)
        this.$message.error('加载月度明细失败')
      }
    },

    // 格式化年月显示 (根据学年逻辑: 8-12月用第一年份, 1-7月用第二年份)
    formatYearMonth(row) {
      const month = row.month
      if (!month) return '-'

      // 找到对应的校历
      const calendar = this.list.find(c => c.id === row.school_calendar)
      if (!calendar) return `${month}月`

      // 解析学年 2026-2027
      const yearParts = calendar.academic_year.split('-')
      const firstYear = parseInt(yearParts[0]) // 2026
      const secondYear = yearParts[1] ? parseInt(yearParts[1]) : firstYear + 1 // 2027

      // 判断月份属于哪个年份
      // 8-12月属于第一学年（如2026）
      // 1-7月属于第二学年（如2027）
      let year
      if (month >= 8) {
        year = firstYear
      } else {
        year = secondYear
      }

      return `${year % 100}.${month}`
    },

    // 新增校历
    handleCreate() {
      this.dialogTitle = '新增校历'
      this.form = {
        id: null,
        academic_year: '',
        year_start_date: '',
        year_end_date: '',
        total_teaching_days: 0,
        first_semester_teaching_days: 0,
        second_semester_teaching_days: 0,
        is_active: true
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm && this.$refs.dataForm.clearValidate()
      })
    },

    // 编辑校历
    handleUpdate(row) {
      this.dialogTitle = '编辑校历'
      this.form = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm && this.$refs.dataForm.clearValidate()
      })
    },

    // 删除校历
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该校历？删除后相关的月度明细也会被删除。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await this.$http.delete(`/schoolcalendar/${row.id}/`)
        this.$message.success('删除成功')
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },

    // 提交校历表单
    submitForm() {
      this.$refs.dataForm.validate(async(valid) => {
        if (valid) {
          try {
            if (this.form.id) {
              await this.$http.put(`/schoolcalendar/${this.form.id}/`, this.form)
              this.$message.success('更新成功')
            } else {
              await this.$http.post('/schoolcalendar/', this.form)
              this.$message.success('创建成功')
            }
            this.dialogVisible = false
            this.getList()
          } catch (error) {
            console.error('保存失败:', error)
            this.$message.error('保存失败')
          }
        }
      })
    },

    // 年月选择变化
    handleYearMonthChange(val) {
      if (val) {
        const [year, month] = val.split('-')
        this.monthForm.month = parseInt(month)
        // 直接拼接日期字符串，避免时区问题
        const lastDayOfMonth = new Date(year, month, 0).getDate()
        this.monthForm.month_start_date = `${year}-${month}-01`
        this.monthForm.month_end_date = `${year}-${month}-${lastDayOfMonth}`
      }
    },

    // 新增月份
    handleAddMonth(calendar) {
      this.currentCalendar = calendar
      this.monthDialogTitle = `新增 ${calendar.academic_year} 月度明细`
      // 默认当前年月
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`
      const lastDay = new Date(year, month, 0).getDate()

      this.monthForm = {
        id: null,
        school_calendar: calendar.id,
        month: month,
        yearMonth: yearMonth,
        month_start_date: `${year}-${String(month).padStart(2, '0')}-01`,
        month_end_date: `${year}-${String(month).padStart(2, '0')}-${lastDay}`,
        working_days_in_month: 22,
        remark: ''
      }
      this.monthDialogVisible = true
      this.$nextTick(() => {
        this.$refs.monthForm && this.$refs.monthForm.clearValidate()
      })
    },

    // 编辑月份
    handleEditMonth(calendar, monthRow) {
      this.currentCalendar = calendar
      this.monthDialogTitle = `编辑 ${calendar.academic_year} ${monthRow.month}月`
      // 从 month_start_date 解析年月
      let yearMonth = ''
      if (monthRow.month_start_date) {
        yearMonth = monthRow.month_start_date.substring(0, 7)
      }

      this.monthForm = {
        ...monthRow,
        yearMonth: yearMonth
      }
      this.monthDialogVisible = true
      this.$nextTick(() => {
        this.$refs.monthForm && this.$refs.monthForm.clearValidate()
      })
    },

    // 删除月份
    async handleDeleteMonth(calendar, monthRow) {
      const monthLabel = this.formatYearMonth(monthRow)
      try {
        await this.$confirm(`确认删除 ${monthLabel} 的明细？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await this.$http.delete(`/schoolcalendarmonth/${monthRow.id}/`)
        this.$message.success('删除成功')
        this.loadMonths(calendar)
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },

    // 提交月份表单
    submitMonthForm() {
      this.$refs.monthForm.validate(async(valid) => {
        if (valid) {
          try {
            // 移除 yearMonth 字段，只提交后端需要的字段
            const submitData = {
              school_calendar: this.monthForm.school_calendar,
              month: this.monthForm.month,
              month_start_date: this.monthForm.month_start_date,
              month_end_date: this.monthForm.month_end_date,
              working_days_in_month: this.monthForm.working_days_in_month,
              remark: this.monthForm.remark || ''
            }

            if (this.monthForm.id) {
              await this.$http.put(`/schoolcalendarmonth/${this.monthForm.id}/`, submitData)
              this.$message.success('更新成功')
            } else {
              await this.$http.post('/schoolcalendarmonth/', submitData)
              this.$message.success('创建成功')
            }
            this.monthDialogVisible = false
            this.loadMonths(this.currentCalendar)
          } catch (error) {
            console.error('保存失败:', error)
            let errorMsg = '保存失败'
            if (error.response && error.response.data) {
              const errorData = error.response.data
              if (errorData.non_field_errors) {
                errorMsg = errorData.non_field_errors.join(', ')
              } else if (errorData.month) {
                errorMsg = `月份错误: ${errorData.month.join(', ')}`
              } else {
                const firstKey = Object.keys(errorData)[0]
                if (firstKey && Array.isArray(errorData[firstKey])) {
                  errorMsg = `${firstKey}: ${errorData[firstKey].join(', ')}`
                }
              }
            }
            this.$message.error(errorMsg)
          }
        }
      })
    },

    // 自动生成月度明细
    async handleGenerateMonths(calendar) {
      try {
        await this.$confirm('将根据学年起止日期自动生成月度明细，是否继续？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        })

        const res = await this.$http.post(`/schoolcalendar/${calendar.id}/generate_months/`)
        if (res.code === 1 || res.success) {
          this.$message.success('生成成功')
          this.loadMonths(calendar)
          // 刷新校历数据以更新统计
          this.getList()
        } else {
          this.$message.error(res.message || '生成失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('生成月度明细失败:', error)
          this.$message.error('生成失败')
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-container {
  padding-bottom: 10px;
  .filter-item {
    margin-right: 10px;
  }
}
</style>
