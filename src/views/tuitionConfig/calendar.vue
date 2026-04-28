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
      <el-button type="warning" icon="el-icon-upload" @click="handleImport">导入校历</el-button>
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
            <div style="margin-bottom: 10px; font-weight: bold; color: #606266; display: flex; justify-content: space-between; align-items: center;">
              <span><i class="el-icon-date" /> {{ scope.row.name }} 到校日历</span>
              <span>
                <el-button v-if="!multiSelectMode" type="text" icon="el-icon-check" @click="toggleMultiSelect(scope.row)">进入多选</el-button>
                <template v-else>
                  <el-tag type="info" size="mini" style="margin-right: 10px;">已选 {{ selectedDayIds.size }} 天</el-tag>
                  <el-button type="success" size="mini" icon="el-icon-check" @click="batchSetTeachingDay(scope.row)">批量到校</el-button>
                  <el-button type="warning" size="mini" icon="el-icon-close" @click="batchSetNonTeachingDay(scope.row)">批量休假</el-button>
                  <el-button type="text" icon="el-icon-close" @click="toggleMultiSelect(scope.row)">退出多选</el-button>
                </template>
              </span>
            </div>
            <!-- 日历视图 -->
            <div class="calendar-view">
              <div v-for="(month, monthIndex) in getCalendarMonths(scope.row)" :key="monthIndex" class="calendar-month">
                <div class="month-title">{{ month.year }}年{{ month.month }}月</div>
                <div class="week-header">
                  <span v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="week-day">{{ day }}</span>
                </div>
                <div class="days-grid">
                  <div
                    v-for="(day, dayIndex) in month.days"
                    :key="dayIndex"
                    :class="[
                      'day-cell',
                      getDayClass(day),
                      { 'clickable': day && !multiSelectMode },
                      { 'multi-selectable': day && multiSelectMode },
                      { 'selected': day && multiSelectMode && selectedDayIds[day.id] }
                    ]"
                    @click="day && handleDayCellClick(scope.row, day)"
                  >
                    <template v-if="day">
                      <div class="day-number">{{ day.date.getDate() }}</div>
                      <div v-if="day.is_teaching_day" class="day-tag teaching">到校</div>
                      <div v-else-if="day.is_weekend" class="day-tag weekend">休</div>
                      <div v-else class="day-tag non-teaching">假</div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="学年" prop="academic_year" align="center" width="120" />
      <el-table-column label="学期" align="center" width="120">
        <template slot-scope="scope">
          {{ formatSemesterType(scope.row.semester) }}
        </template>
      </el-table-column>
      <el-table-column label="学期名称" prop="name" align="center" min-width="200" show-overflow-tooltip />
      <el-table-column label="开始日期" prop="start_date" align="center" width="120" />
      <el-table-column label="结束日期" prop="end_date" align="center" width="120" />
      <el-table-column label="总到校日" prop="total_teaching_days" align="center" width="100" />
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

    <!-- 新增/编辑学期对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px">
      <el-form ref="dataForm" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="学期名称" prop="name">
          <el-input v-model="form.name" placeholder="如：2026-2027 第一学期" />
        </el-form-item>
        <el-form-item label="学年" prop="academic_year">
          <el-input v-model="form.academic_year" placeholder="如：2026-2027" />
        </el-form-item>
        <el-form-item label="学期类型" prop="semester">
          <el-select v-model="form.semester" placeholder="选择学期类型" style="width: 100%;">
            <el-option label="第一学期" value="First" />
            <el-option label="第二学期" value="Second" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="end_date">
              <el-date-picker
                v-model="form.end_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="总到校日">
          <el-input-number v-model="form.total_teaching_days" :min="0" :precision="0" style="width: 100%;" disabled />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>

    <!-- 导入校历对话框 -->
    <el-dialog title="导入校历Excel" :visible.sync="importDialogVisible" width="550px">
      <el-form ref="importForm" :model="importForm" :rules="importRules" label-width="120px">
        <el-form-item label="Excel文件" prop="file">
          <el-upload
            ref="upload"
            class="upload-demo"
            action=""
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :limit="1"
            accept=".xlsx,.xls"
          >
            <el-button size="small" type="primary">选择文件</el-button>
            <div slot="tip" class="el-upload__tip">只能上传 Excel 文件(.xlsx/.xls)</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="学年" prop="academic_year">
          <el-select v-model="importForm.academic_year" placeholder="选择学年" style="width: 100%;">
            <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="学期类型" prop="semester_type">
          <el-select v-model="importForm.semester_type" placeholder="选择学期" style="width: 100%;">
            <el-option label="第一学期" value="First" />
            <el-option label="第二学期" value="Second" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker
                v-model="importForm.start_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="end_date">
              <el-date-picker
                v-model="importForm.end_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div v-if="importResult" class="import-result">
        <el-divider content-position="left">导入结果</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="学年">{{ importResult.academic_year }}</el-descriptions-item>
          <el-descriptions-item label="学期">{{ importResult.semester.type_display }}</el-descriptions-item>
          <el-descriptions-item label="到校日">{{ importResult.import_result.teaching_days }} 天</el-descriptions-item>
          <el-descriptions-item label="周末">{{ importResult.import_result.weekend_days }} 天</el-descriptions-item>
          <el-descriptions-item label="非到校日">{{ importResult.import_result.non_teaching_days }} 天</el-descriptions-item>
          <el-descriptions-item label="导入天数">{{ importResult.import_result.imported_days }} 天</el-descriptions-item>
        </el-descriptions>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="importDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="importLoading" @click="submitImport">开始导入</el-button>
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
        name: '',
        academic_year: '',
        semester: '',
        start_date: '',
        end_date: '',
        total_teaching_days: 0,
        is_active: true
      },
      rules: {
        name: [{ required: true, message: '请输入学期名称', trigger: 'blur' }],
        academic_year: [{ required: true, message: '请输入学年', trigger: 'blur' }],
        semester: [{ required: true, message: '请选择学期类型', trigger: 'change' }],
        start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
        end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
      },
      // 导入校历相关
      importDialogVisible: false,
      importLoading: false,
      importForm: {
        file: null,
        academic_year: '',
        semester_type: '',
        start_date: '',
        end_date: ''
      },
      importRules: {
        academic_year: [{ required: true, message: '请选择学年', trigger: 'change' }],
        semester_type: [{ required: true, message: '请选择学期类型', trigger: 'change' }],
        start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
        end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
      },
      importResult: null,
      academicYearOptions: [],
      // 多选模式
      multiSelectMode: false,
      selectedDayIds: {}
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

    // 获取学期列表
    async getList() {
      this.listLoading = true
      try {
        const params = {}
        if (this.listQuery.academic_year) {
          params.academic_year = this.listQuery.academic_year
        }
        const res = await this.$http.get('/semester/', { params })

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
      } catch (error) {
        console.error('获取学期列表失败:', error)
        this.$message.error('获取学期列表失败')
      } finally {
        this.listLoading = false
      }
    },

    // 展开行时加载每日校历明细
    async handleExpandChange(row, expandedRows) {
      if (expandedRows.includes(row) && (!row.calendar_days || row.calendar_days.length === 0)) {
        await this.loadCalendarDays(row)
      }
    },

    // 加载每日校历明细
    async loadCalendarDays(semester) {
      try {
        const res = await this.$http.get('/schoolcalendar/', {
          params: { semester_id: semester.id }
        })

        let days = []
        if (Array.isArray(res)) {
          days = res
        } else if (res.results && Array.isArray(res.results)) {
          days = res.results
        } else if (res.data && Array.isArray(res.data)) {
          days = res.data
        }

        this.$set(semester, 'calendar_days', days)
      } catch (error) {
        console.error('加载每日校历失败:', error)
        this.$message.error('加载每日校历失败')
      }
    },

    // 格式化学期类型显示
    formatSemesterType(type) {
      const typeMap = {
        'First': '第一学期',
        'Second': '第二学期'
      }
      return typeMap[type] || type
    },

    // 获取日历月份数据
    getCalendarMonths(semester) {
      if (!semester.calendar_days || semester.calendar_days.length === 0) {
        return []
      }

      const days = semester.calendar_days
      const monthsMap = new Map()

      days.forEach(day => {
        const date = new Date(day.date)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const key = `${year}-${month}`

        if (!monthsMap.has(key)) {
          monthsMap.set(key, {
            year,
            month,
            days: []
          })
        }

        monthsMap.get(key).days.push({
          id: day.id,
          date,
          is_teaching_day: day.is_teaching_day,
          is_weekend: day.note === 'Weekend',
          is_semester_start: day.is_semester_start,
          is_semester_end: day.is_semester_end,
          note: day.note
        })
      })

      // 为每个月填充空白天数，使其成为完整的日历网格
      const result = []
      monthsMap.forEach(monthData => {
        const firstDay = monthData.days[0].date
        const firstDayOfWeek = firstDay.getDay() // 0=周日, 1=周一...

        // 在前面填充空白天数
        const paddedDays = []
        for (let i = 0; i < firstDayOfWeek; i++) {
          paddedDays.push(null)
        }

        // 填充该月的所有天数
        paddedDays.push(...monthData.days)

        // 补全到35个格子（5行）或42个格子（6行）
        const totalCells = paddedDays.length <= 35 ? 35 : 42
        while (paddedDays.length < totalCells) {
          paddedDays.push(null)
        }

        result.push({
          year: monthData.year,
          month: monthData.month,
          days: paddedDays
        })
      })

      // 按年月排序
      return result.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })
    },

    // 获取日期单元格的样式类
    getDayClass(day) {
      if (!day) return 'empty'
      const classes = []
      if (day.is_teaching_day) {
        classes.push('teaching-day')
      } else if (day.is_weekend) {
        classes.push('weekend-day')
      } else {
        classes.push('non-teaching-day')
      }
      if (day.is_semester_start || day.is_semester_end) {
        classes.push('semester-edge')
      }
      return classes.join(' ')
    },

    // 点击日期切换到校日状态
    async handleDayClick(semester, day) {
      // 周末不能修改
      if (day.is_weekend) {
        this.$message.info('周末不能修改为到校日')
        return
      }

      try {
        const newStatus = !day.is_teaching_day
        const actionText = newStatus ? '设为到校日' : '设为非到校日'

        await this.$confirm(`确认将该日期${actionText}？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        // 调用API更新
        const res = await this.$http.patch(`/schoolcalendar/${day.id}/`, {
          is_teaching_day: newStatus
        })

        // 更新本地数据
        // eslint-disable-next-line require-atomic-updates
        day.is_teaching_day = newStatus

        // 更新原始 calendar_days 数据中的对应项
        const calendarDay = semester.calendar_days.find(d => d.id === day.id)
        if (calendarDay) {
          calendarDay.is_teaching_day = newStatus
        }

        // 使用后端返回的 semester_total_teaching_days 更新总到校日
        if (res && res.semester_total_teaching_days !== undefined) {
          this.updateSemesterTeachingDays(semester, res.semester_total_teaching_days)
        } else {
          // 如果后端没有返回，则本地计算
          this.recalculateTeachingDays(semester)
        }

        this.$message.success('更新成功')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('更新失败:', error)
          this.$message.error('更新失败')
        }
      }
    },

    // 切换多选模式
    toggleMultiSelect(semester) {
      this.multiSelectMode = !this.multiSelectMode
      this.selectedDayIds = {}
    },

    // 日期格子点击（多选模式）
    handleDayCellClick(semester, day) {
      if (this.multiSelectMode) {
        if (this.selectedDayIds[day.id]) {
          this.$delete(this.selectedDayIds, day.id)
        } else {
          this.$set(this.selectedDayIds, day.id, true)
        }
      } else {
        this.handleDayClick(semester, day)
      }
    },

    // 批量设为到校日
    async batchSetTeachingDay(semester) {
      const ids = Object.keys(this.selectedDayIds).map(Number)
      if (ids.length === 0) {
        this.$message.warning('请先选择日期')
        return
      }
      try {
        await this.$confirm(`确认将选中的 ${ids.length} 天设为到校日？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        this.listLoading = true
        await this.$http.patch('/schoolcalendar/batch-update/', {
          ids: ids,
          is_teaching_day: true
        })
        // 更新本地数据
        ids.forEach(id => {
          const calendarDay = semester.calendar_days.find(d => d.id === id)
          if (calendarDay && !calendarDay.is_weekend) {
            calendarDay.is_teaching_day = true
          }
        })
        this.recalculateTeachingDays(semester)
        this.selectedDayIds = {}
        this.$message.success('批量更新成功')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量更新失败:', error)
          this.$message.error('批量更新失败')
        }
      } finally {
        this.listLoading = false
      }
    },

    // 批量设为非到校日（休假）
    async batchSetNonTeachingDay(semester) {
      const ids = Object.keys(this.selectedDayIds).map(Number)
      if (ids.length === 0) {
        this.$message.warning('请先选择日期')
        return
      }
      try {
        await this.$confirm(`确认将选中的 ${ids.length} 天设为非到校日？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        this.listLoading = true
        await this.$http.patch('/schoolcalendar/batch-update/', {
          ids: ids,
          is_teaching_day: false
        })
        // 更新本地数据
        ids.forEach(id => {
          const calendarDay = semester.calendar_days.find(d => d.id === id)
          if (calendarDay) {
            calendarDay.is_teaching_day = false
          }
        })
        this.recalculateTeachingDays(semester)
        this.selectedDayIds = {}
        this.$message.success('批量更新成功')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量更新失败:', error)
          this.$message.error('批量更新失败')
        }
      } finally {
        this.listLoading = false
      }
    },

    // 使用后端返回的总到校日数更新学期数据
    updateSemesterTeachingDays(semester, totalDays) {
      semester.total_teaching_days = totalDays
      // 强制更新列表中的学期数据
      const index = this.list.findIndex(s => s.id === semester.id)
      if (index !== -1) {
        this.$set(this.list[index], 'total_teaching_days', totalDays)
      }
    },

    // 重新计算学期的总到校日数（本地计算备用）
    recalculateTeachingDays(semester) {
      if (!semester.calendar_days) return

      const teachingDays = semester.calendar_days.filter(day => day.is_teaching_day).length
      semester.total_teaching_days = teachingDays

      // 强制更新列表中的学期数据
      const index = this.list.findIndex(s => s.id === semester.id)
      if (index !== -1) {
        this.$set(this.list[index], 'total_teaching_days', teachingDays)
      }
    },

    // 新增学期
    handleCreate() {
      this.dialogTitle = '新增学期'
      this.form = {
        id: null,
        name: '',
        academic_year: '',
        semester: '',
        start_date: '',
        end_date: '',
        total_teaching_days: 0,
        is_active: true
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm && this.$refs.dataForm.clearValidate()
      })
    },

    // 编辑学期
    handleUpdate(row) {
      this.dialogTitle = '编辑学期'
      this.form = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm && this.$refs.dataForm.clearValidate()
      })
    },

    // 删除学期
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该学期？删除后相关的每日校历数据也会被删除。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await this.$http.delete(`/semester/${row.id}/`)
        this.$message.success('删除成功')
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },

    // 提交学期表单
    submitForm() {
      this.$refs.dataForm.validate(async(valid) => {
        if (valid) {
          try {
            if (this.form.id) {
              await this.$http.put(`/semester/${this.form.id}/`, this.form)
              this.$message.success('更新成功')
            } else {
              await this.$http.post('/semester/', this.form)
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

    // 打开导入校历对话框
    async handleImport() {
      this.importDialogVisible = true
      this.importResult = null
      this.importForm = {
        file: null,
        academic_year: '',
        semester_type: '',
        start_date: '',
        end_date: ''
      }
      // 加载计算规则中的学年列表
      try {
        const res = await this.$http.get('/tuitioncalculationconfig/')
        let configs = []
        if (Array.isArray(res)) configs = res
        else if (res.results && Array.isArray(res.results)) configs = res.results
        else if (res.data && Array.isArray(res.data)) configs = res.data
        const years = configs.map(c => c.academic_year).filter(Boolean)
        this.academicYearOptions = [...new Set(years)]
        const activeConfig = configs.find(c => c.is_active)
        if (activeConfig && activeConfig.academic_year) {
          this.importForm.academic_year = activeConfig.academic_year
        }
      } catch (e) {
        console.error('加载计算规则学年失败', e)
      }
      this.$nextTick(() => {
        this.$refs.importForm && this.$refs.importForm.clearValidate()
        this.$refs.upload && this.$refs.upload.clearFiles()
      })
    },

    // 文件选择变化
    handleFileChange(file) {
      this.importForm.file = file.raw
    },

    // 文件移除
    handleFileRemove() {
      this.importForm.file = null
    },

    // 提交导入
    submitImport() {
      this.$refs.importForm.validate(async(valid) => {
        if (!valid) return

        if (!this.importForm.file) {
          this.$message.warning('请选择Excel文件')
          return
        }

        this.importLoading = true
        this.importResult = null

        try {
          // 创建FormData
          const formData = new FormData()
          formData.append('file', this.importForm.file)
          formData.append('academic_year', this.importForm.academic_year)
          formData.append('semester_type', this.importForm.semester_type)
          formData.append('start_date', this.importForm.start_date)
          formData.append('end_date', this.importForm.end_date)
          formData.append('use_color', 'true')

          // 调用导入接口
          const res = await this.$http.post('/calendar-import/import-semester/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })

          if (res.code === 1) {
            this.importResult = res.data
            this.$message.success(res.message || '导入成功')
            // 刷新列表
            this.getList()
          } else {
            this.$message.error(res.message || '导入失败')
          }
        } catch (error) {
          console.error('导入失败:', error)
          let errorMsg = '导入失败'
          if (error.response && error.response.data) {
            const errorData = error.response.data
            if (errorData.error) {
              errorMsg = errorData.error
            } else if (errorData.message) {
              errorMsg = errorData.message
            }
          }
          this.$message.error(errorMsg)
        } finally {
          this.importLoading = false
        }
      })
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
.import-result {
  margin-top: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

// 日历视图样式
.calendar-view {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: flex-start;
}
.calendar-month {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  width: 320px;
}
.month-title {
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}
.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 5px;
}
.week-day {
  font-size: 12px;
  color: #909399;
  padding: 5px;
}
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  position: relative;
  min-height: 36px;
}
.day-cell.empty {
  background: transparent;
}
.day-cell.clickable {
  cursor: pointer;
  transition: all 0.2s;
}
.day-cell.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.day-number {
  font-weight: 500;
}
.day-tag {
  font-size: 10px;
  margin-top: 2px;
  padding: 0 3px;
  border-radius: 2px;
}

// 到校日样式 - 绿色
.teaching-day {
  background-color: #f0f9eb;
  border: 1px solid #b3e19d;
  .day-number {
    color: #67c23a;
  }
  .day-tag.teaching {
    background-color: #67c23a;
    color: #fff;
  }
}

// 周末样式 - 灰色
.weekend-day {
  background-color: #f4f4f5;
  border: 1px solid #d3d3d3;
  .day-number {
    color: #909399;
  }
  .day-tag.weekend {
    background-color: #909399;
    color: #fff;
  }
}

// 非到校日样式 - 橙色
.non-teaching-day {
  background-color: #fdf6ec;
  border: 1px solid #f5dab1;
  .day-number {
    color: #e6a23c;
  }
  .day-tag.non-teaching {
    background-color: #e6a23c;
    color: #fff;
  }
}

// 学期开始/结束标记
.semester-edge {
  box-shadow: 0 0 0 2px #409eff;
}

// 多选模式样式
.day-cell.multi-selectable {
  cursor: pointer;
  transition: all 0.2s;
}
.day-cell.multi-selectable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.day-cell.selected {
  box-shadow: 0 0 0 2px #409eff;
  transform: scale(1.05);
}
</style>
