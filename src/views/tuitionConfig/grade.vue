<template>
  <div class="app-container">
    <!-- 操作栏 -->
    <el-card class="operate-container search-header" shadow="never">
      <div class="table-operation">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增年级配置</el-button>
        <el-button icon="el-icon-refresh" @click="getList">刷新</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-container" shadow="never" style="margin-top: 15px;">
      <el-table
        v-loading="listLoading"
        :data="list"
        element-loading-text="加载中..."
        border
        fit
        highlight-current-row
        style="width: 100%;"
        :max-height="tableHeight"
      >
        <el-table-column label="学年" prop="academic_year" align="center" min-width="120" />
        <el-table-column label="年级名称" prop="grade_name" align="center" min-width="120" />
        <el-table-column label="年级代码" prop="grade_code" align="center" min-width="120" />
        <el-table-column label="基础学费" prop="base_tuition" align="center" min-width="150">
          <template slot-scope="scope">
            <span class="amount-text">¥{{ formatMoney(scope.row.base_tuition) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册费" prop="registration_fee" align="center" min-width="120">
          <template slot-scope="scope">
            <span>¥{{ formatMoney(scope.row.registration_fee) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sort_order" align="center" width="80" />
        <el-table-column label="状态" align="center" width="100">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.is_active" @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" style="color: #f56c6c;" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态提示 -->
      <div v-if="!listLoading && list.length === 0" style="text-align: center; padding: 40px 0;">
        <i class="el-icon-warning-outline" style="font-size: 48px; color: #909399;" />
        <p style="color: #909399; margin-top: 10px;">暂无数据，请点击"新增年级配置"按钮添加</p>
      </div>
    </el-card>

    <!-- 编辑/新增对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px">
      <el-form ref="gradeForm" :model="gradeForm" :rules="rules" label-width="120px">
        <el-form-item label="学年" prop="academic_year">
          <el-input v-model="gradeForm.academic_year" placeholder="如：2025-2026" />
        </el-form-item>
        <el-form-item label="年级名称" prop="grade_name">
          <el-input v-model="gradeForm.grade_name" placeholder="如：PYP5" />
        </el-form-item>
        <el-form-item label="年级代码" prop="grade_code">
          <el-input v-model="gradeForm.grade_code" placeholder="如：P5" />
        </el-form-item>
        <el-form-item label="基础学费" prop="base_tuition">
          <el-input-number v-model="gradeForm.base_tuition" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="注册费" prop="registration_fee">
          <el-input-number v-model="gradeForm.registration_fee" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="gradeForm.sort_order" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="gradeForm.is_active" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'GradeTuitionConfig',
  data() {
    return {
      list: [],
      listLoading: false,
      tableHeight: 531,
      dialogVisible: false,
      dialogTitle: '',
      isEdit: false,
      gradeForm: {
        id: null,
        academic_year: '',
        grade_name: '',
        grade_code: '',
        base_tuition: 165000,
        registration_fee: 2000,
        sort_order: 0,
        is_active: true
      },
      rules: {
        academic_year: [{ required: true, message: '请输入学年', trigger: 'blur' }],
        grade_name: [{ required: true, message: '请输入年级名称', trigger: 'blur' }],
        grade_code: [{ required: true, message: '请输入年级代码', trigger: 'blur' }],
        base_tuition: [{ required: true, message: '请输入基础学费', trigger: 'blur' }],
        registration_fee: [{ required: true, message: '请输入注册费', trigger: 'blur' }]
      }
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
        // 50: 顶部导航, 40: card margin, 30: 底部间距, 32: 其他间距
        this.tableHeight = innerHeight - 50 - headerHeight - 40 - 30 - 32
      })
    },
    // 格式化金额
    formatMoney(value) {
      if (value === null || value === undefined) return '0.00'
      return parseFloat(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    // 获取年级配置列表
    async getList() {
      this.listLoading = true
      try {
        const res = await this.$http.get('/gradetuitionconfig/')
        console.log('年级配置返回数据:', res)
        
        // 处理不同可能的返回格式
        let dataList = []
        if (Array.isArray(res)) {
          // 直接返回数组
          dataList = res
        } else if (res.results && Array.isArray(res.results)) {
          // DRF 分页格式
          dataList = res.results
        } else if (res.data && Array.isArray(res.data)) {
          // 包装在 data 字段中
          dataList = res.data
        } else if (typeof res === 'object' && res !== null) {
          // 可能是对象形式，尝试提取
          dataList = [res]
        }
        
        this.list = dataList
        
        if (dataList.length === 0) {
          this.$message.info('暂无年级配置数据')
        }
      } catch (error) {
        console.error('获取年级配置失败:', error)
        this.$message.error('获取年级配置失败: ' + (error.message || '网络错误'))
        this.list = []
      } finally {
        this.listLoading = false
      }
    },
    // 新增
    handleAdd() {
      this.isEdit = false
      this.dialogTitle = '新增年级配置'
      this.gradeForm = {
        id: null,
        academic_year: '',
        grade_name: '',
        grade_code: '',
        base_tuition: 165000,
        registration_fee: 2000,
        sort_order: 0,
        is_active: true
      }
      this.dialogVisible = true
      // 重置表单验证
      this.$nextTick(() => {
        this.$refs.gradeForm && this.$refs.gradeForm.clearValidate()
      })
    },
    // 编辑
    handleEdit(row) {
      this.isEdit = true
      this.dialogTitle = '编辑年级配置'
      this.gradeForm = { 
        id: row.id,
        academic_year: row.academic_year || '',
        grade_name: row.grade_name || '',
        grade_code: row.grade_code || '',
        base_tuition: parseFloat(row.base_tuition) || 0,
        registration_fee: parseFloat(row.registration_fee) || 0,
        sort_order: row.sort_order || 0,
        is_active: row.is_active !== false
      }
      this.dialogVisible = true
      // 重置表单验证
      this.$nextTick(() => {
        this.$refs.gradeForm && this.$refs.gradeForm.clearValidate()
      })
    },
    // 删除
    async handleDelete(row) {
      try {
        await this.$confirm(`确认删除年级 "${row.grade_name}" 的配置?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await this.$http.delete(`/gradetuitionconfig/${row.id}/`)
        this.$message.success('删除成功')
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          this.$message.error('删除失败: ' + (error.message || '未知错误'))
        }
      }
    },
    // 状态变更
    async handleStatusChange(row) {
      try {
        await this.$http.patch(`/gradetuitionconfig/${row.id}/`, { is_active: row.is_active })
        this.$message.success('状态更新成功')
      } catch (error) {
        console.error('状态更新失败:', error)
        this.$message.error('状态更新失败')
        row.is_active = !row.is_active
      }
    },
    // 提交表单
    async handleSubmit() {
      this.$refs.gradeForm.validate(async(valid) => {
        if (valid) {
          try {
            // 确保数值类型正确
            const submitData = {
              ...this.gradeForm,
              base_tuition: parseFloat(this.gradeForm.base_tuition) || 0,
              registration_fee: parseFloat(this.gradeForm.registration_fee) || 0,
              sort_order: parseInt(this.gradeForm.sort_order) || 0
            }
            
            if (this.isEdit) {
              await this.$http.put(`/gradetuitionconfig/${this.gradeForm.id}/`, submitData)
              this.$message.success('更新成功')
            } else {
              await this.$http.post('/gradetuitionconfig/', submitData)
              this.$message.success('新增成功')
            }
            this.dialogVisible = false
            this.getList()
          } catch (error) {
            console.error(this.isEdit ? '更新失败:' : '新增失败:', error)
            this.$message.error(this.isEdit ? '更新失败' : '新增失败')
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.operate-container {
  .table-operation {
    .el-button {
      margin-right: 10px;
    }
  }
}

.amount-text {
  color: #f56c6c;
  font-weight: bold;
}
</style>
