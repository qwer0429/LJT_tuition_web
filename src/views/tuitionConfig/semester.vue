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
      <el-select
        v-model="listQuery.semester_number"
        placeholder="学期"
        style="width: 120px;"
        class="filter-item"
        clearable
      >
        <el-option label="第一学期" :value="1" />
        <el-option label="第二学期" :value="2" />
      </el-select>
      <el-button type="primary" icon="el-icon-search" @click="getList">查询</el-button>
      <el-button type="success" icon="el-icon-plus" @click="handleCreate">新增学期配置</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      :max-height="tableHeight"
    >
      <el-table-column label="ID" prop="id" align="center" width="60" />
      <el-table-column label="学期名称" prop="name" align="center" />
      <el-table-column label="学年" prop="academic_year" align="center" width="100" />
      <el-table-column label="学期" align="center" width="80">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.semester_number === 1" type="primary">第一学期</el-tag>
          <el-tag v-else type="success">第二学期</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开始日期" align="center" width="110">
        <template slot-scope="scope">{{ scope.row.start_date }}</template>
      </el-table-column>
      <el-table-column label="结束日期" align="center" width="110">
        <template slot-scope="scope">{{ scope.row.end_date }}</template>
      </el-table-column>
      <el-table-column label="总工作日" prop="total_working_days" align="center" width="80" />
      <el-table-column label="当前学期" align="center" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.is_current" type="danger">是</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="80">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.is_active" type="success">启用</el-tag>
          <el-tag v-else type="info">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleUpdate(scope.row)" />
          <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete(scope.row)" />
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页信息 -->
    <div v-if="total > 0" style="margin-top: 15px; text-align: right; color: #666;">
      共 {{ total }} 条记录
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px">
      <el-form
        ref="dataForm"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="学期名称" prop="name">
          <el-input v-model="form.name" placeholder="如：2025-2026第一学期" />
        </el-form-item>
        <el-form-item label="学年" prop="academic_year">
          <el-input v-model="form.academic_year" placeholder="如：2025-2026" />
        </el-form-item>
        <el-form-item label="学期" prop="semester_number">
          <el-radio-group v-model="form.semester_number">
            <el-radio :label="1">第一学期</el-radio>
            <el-radio :label="2">第二学期</el-radio>
          </el-radio-group>
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
        <el-form-item label="总工作日" prop="total_working_days">
          <el-input-number v-model="form.total_working_days" :min="1" :max="200" style="width: 200px;" />
          <span class="form-tip">整个学期的工作日总数</span>
        </el-form-item>
        <el-form-item label="当前学期">
          <el-switch v-model="form.is_current" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'SemesterConfig',
  data() {
    return {
      list: [],
      total: 0,
      listLoading: false,
      tableHeight: 531,
      listQuery: {
        academic_year: '',
        semester_number: null
      },
      dialogVisible: false,
      dialogTitle: '',
      form: {
        name: '',
        academic_year: '2025-2026',
        semester_number: 1,
        start_date: '',
        end_date: '',
        total_working_days: 90,
        is_current: false,
        is_active: true
      },
      rules: {
        name: [{ required: true, message: '请输入学期名称', trigger: 'blur' }],
        academic_year: [{ required: true, message: '请输入学年', trigger: 'blur' }],
        semester_number: [{ required: true, message: '请选择学期', trigger: 'change' }],
        start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
        end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
        total_working_days: [{ required: true, message: '请输入总工作日', trigger: 'blur' }]
      },
      isEdit: false,
      editId: null
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
    // 计算表格最大高度，避免双滚动条
    getTableHeight() {
      this.$nextTick(() => {
        const innerHeight = window.innerHeight
        const header = document.getElementsByClassName('search-header')[0]
        const headerHeight = header ? header.clientHeight : 0
        // 50: 顶部导航, 40: margin, 30: 底部分页区域, 32: 其他间距
        this.tableHeight = innerHeight - 50 - headerHeight - 40 - 30 - 32
      })
    },
    
    async getList() {
      this.listLoading = true
      try {
        const params = {
          ...this.listQuery,
          ordering: '-academic_year,semester_number'
        }
        const res = await this.$http.get('/semesterconfig/', { params })
        let results = []
        if (Array.isArray(res)) {
          results = res
        } else if (res.results) {
          results = res.results
        } else if (res.data) {
          results = Array.isArray(res.data) ? res.data : [res.data]
        }
        this.list = results
        this.total = res.count || results.length
      } catch (error) {
        this.$message.error('获取列表失败')
      } finally {
        this.listLoading = false
      }
    },
    handleCreate() {
      this.isEdit = false
      this.editId = null
      this.dialogTitle = '新增学期配置'
      this.resetForm()
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    },
    handleUpdate(row) {
      this.isEdit = true
      this.editId = row.id
      this.dialogTitle = '编辑学期配置'
      this.form = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate()
      })
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确认删除该学期配置吗？', '提示', { type: 'warning' })
        await this.$http.delete(`/semesterconfig/${row.id}/`)
        this.$message.success('删除成功')
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    submitForm() {
      this.$refs.dataForm.validate(async valid => {
        if (!valid) return
        try {
          if (this.isEdit) {
            await this.$http.put(`/semesterconfig/${this.editId}/`, this.form)
            this.$message.success('更新成功')
          } else {
            await this.$http.post('/semesterconfig/', this.form)
            this.$message.success('创建成功')
          }
          this.dialogVisible = false
          this.getList()
        } catch (error) {
          this.$message.error(this.isEdit ? '更新失败' : '创建失败')
        }
      })
    },
    resetForm() {
      this.form = {
        name: '',
        academic_year: '2025-2026',
        semester_number: 1,
        start_date: '',
        end_date: '',
        total_working_days: 90,
        bus_fee: this.form.semester_number === 1 ? 5900 : 5100,
        is_current: false,
        is_active: true
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
.form-tip {
  margin-left: 10px;
  color: #999;
  font-size: 12px;
}
</style>
