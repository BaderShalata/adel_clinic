import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/api_service.dart';
import '../../models/news.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/error_view.dart';

class AdminNewsScreen extends StatefulWidget {
  const AdminNewsScreen({super.key});

  @override
  State<AdminNewsScreen> createState() => _AdminNewsScreenState();
}

class _AdminNewsScreenState extends State<AdminNewsScreen> {
  final ApiService _apiService = ApiService();
  List<News> _news = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadNews();
  }

  Future<void> _loadNews() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final news = await _apiService.getAllNews();
      setState(() {
        _news = news;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteNews(News news) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete News'),
        content: Text('Are you sure you want to delete "${news.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.errorColor),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _apiService.deleteNews(news.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white, size: 20),
              SizedBox(width: 8),
              Text('News deleted successfully'),
            ],
          ),
          backgroundColor: AppTheme.successColor,
        ),
      );
      _loadNews();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Future<void> _togglePublish(News news) async {
    try {
      await _apiService.updateNews(
        newsId: news.id,
        isPublished: !news.isPublished,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text(news.isPublished ? 'News unpublished' : 'News published'),
            ],
          ),
          backgroundColor: AppTheme.successColor,
        ),
      );
      _loadNews();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showNewsForm({News? news}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _NewsFormScreen(
          news: news,
          onSaved: _loadNews,
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'announcement':
        return Colors.blue;
      case 'health-tip':
        return Colors.green;
      case 'event':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'announcement':
        return Icons.campaign;
      case 'health-tip':
        return Icons.health_and_safety;
      case 'event':
        return Icons.event;
      default:
        return Icons.article;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.all(AppTheme.spacingM),
        child: ShimmerList(itemCount: 5, itemHeight: 140),
      );
    }

    if (_errorMessage != null) {
      return ErrorView(
        message: _errorMessage!,
        onRetry: _loadNews,
      );
    }

    return Scaffold(
      body: _news.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppTheme.spacingL),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceMedium,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.newspaper,
                      size: 48,
                      color: AppTheme.textHint,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  Text(
                    'No news articles yet',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                  ),
                  const SizedBox(height: AppTheme.spacingS),
                  Text(
                    'Create your first news article',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textHint,
                        ),
                  ),
                  const SizedBox(height: AppTheme.spacingL),
                  ElevatedButton.icon(
                    onPressed: () => _showNewsForm(),
                    icon: const Icon(Icons.add),
                    label: const Text('Create News'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadNews,
              child: ListView.builder(
                padding: const EdgeInsets.all(AppTheme.spacingM),
                itemCount: _news.length,
                itemBuilder: (context, index) {
                  final news = _news[index];
                  final categoryColor = _getCategoryColor(news.category);
                  final dateFormat = DateFormat('MMM d, yyyy');

                  return ModernCard(
                    margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
                    onTap: () => _showNewsForm(news: news),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header with image and status
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Image thumbnail
                            if (news.imageURL != null && news.imageURL!.isNotEmpty)
                              ClipRRect(
                                borderRadius: BorderRadius.circular(AppTheme.radiusS),
                                child: CachedNetworkImage(
                                  imageUrl: news.imageURL!,
                                  width: 80,
                                  height: 80,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(
                                    width: 80,
                                    height: 80,
                                    color: AppTheme.surfaceMedium,
                                    child: const Center(
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    ),
                                  ),
                                  errorWidget: (context, url, error) => Container(
                                    width: 80,
                                    height: 80,
                                    color: AppTheme.surfaceMedium,
                                    child: const Icon(Icons.broken_image, color: AppTheme.textHint),
                                  ),
                                ),
                              )
                            else
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: categoryColor.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(AppTheme.radiusS),
                                ),
                                child: Icon(
                                  _getCategoryIcon(news.category),
                                  color: categoryColor,
                                  size: 32,
                                ),
                              ),
                            const SizedBox(width: AppTheme.spacingM),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Title
                                  Text(
                                    news.title,
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                          fontWeight: FontWeight.w600,
                                        ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  // Category and status badges
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: categoryColor.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(AppTheme.radiusRound),
                                        ),
                                        child: Text(
                                          news.category.toUpperCase().replaceAll('-', ' '),
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: categoryColor,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: news.isPublished
                                              ? AppTheme.successColor.withValues(alpha: 0.1)
                                              : AppTheme.warningColor.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(AppTheme.radiusRound),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              news.isPublished ? Icons.visibility : Icons.visibility_off,
                                              size: 10,
                                              color: news.isPublished ? AppTheme.successColor : AppTheme.warningColor,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              news.isPublished ? 'PUBLISHED' : 'DRAFT',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                color: news.isPublished ? AppTheme.successColor : AppTheme.warningColor,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  // Date
                                  Text(
                                    news.publishedAt != null
                                        ? 'Published: ${dateFormat.format(news.publishedAt!)}'
                                        : 'Created: ${news.createdAt != null ? dateFormat.format(news.createdAt!) : 'Unknown'}',
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                          color: AppTheme.textHint,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppTheme.spacingM),
                        // Content preview
                        Text(
                          news.content,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: AppTheme.spacingM),
                        // Actions
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _togglePublish(news),
                                icon: Icon(
                                  news.isPublished ? Icons.visibility_off : Icons.visibility,
                                  size: 18,
                                ),
                                label: Text(news.isPublished ? 'Unpublish' : 'Publish'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: news.isPublished ? AppTheme.warningColor : AppTheme.successColor,
                                  side: BorderSide(
                                    color: news.isPublished
                                        ? AppTheme.warningColor.withValues(alpha: 0.5)
                                        : AppTheme.successColor.withValues(alpha: 0.5),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: AppTheme.spacingS),
                            OutlinedButton.icon(
                              onPressed: () => _showNewsForm(news: news),
                              icon: const Icon(Icons.edit, size: 18),
                              label: const Text('Edit'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.primaryColor,
                                side: BorderSide(color: AppTheme.primaryColor.withValues(alpha: 0.5)),
                              ),
                            ),
                            const SizedBox(width: AppTheme.spacingS),
                            IconButton(
                              onPressed: () => _deleteNews(news),
                              icon: const Icon(Icons.delete_outline),
                              color: AppTheme.errorColor,
                              style: IconButton.styleFrom(
                                backgroundColor: AppTheme.errorColor.withValues(alpha: 0.1),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
      floatingActionButton: _news.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: () => _showNewsForm(),
              icon: const Icon(Icons.add),
              label: const Text('Add News'),
              backgroundColor: AppTheme.primaryColor,
            )
          : null,
    );
  }
}

class _NewsFormScreen extends StatefulWidget {
  final News? news;
  final VoidCallback onSaved;

  const _NewsFormScreen({this.news, required this.onSaved});

  @override
  State<_NewsFormScreen> createState() => _NewsFormScreenState();
}

class _NewsFormScreenState extends State<_NewsFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _imagePicker = ImagePicker();
  bool _isLoading = false;

  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _imageUrlController = TextEditingController();

  String _selectedCategory = 'general';
  bool _isPublished = false;
  File? _selectedImage;
  bool _useImageUrl = true;

  bool get isEditing => widget.news != null;

  final List<Map<String, dynamic>> _categories = [
    {'value': 'general', 'label': 'General', 'icon': Icons.article, 'color': Colors.grey},
    {'value': 'announcement', 'label': 'Announcement', 'icon': Icons.campaign, 'color': Colors.blue},
    {'value': 'health-tip', 'label': 'Health Tip', 'icon': Icons.health_and_safety, 'color': Colors.green},
    {'value': 'event', 'label': 'Event', 'icon': Icons.event, 'color': Colors.purple},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.news != null) {
      _loadNewsData(widget.news!);
    }
  }

  void _loadNewsData(News news) {
    _titleController.text = news.title;
    _contentController.text = news.content;
    _imageUrlController.text = news.imageURL ?? '';
    _selectedCategory = news.category;
    _isPublished = news.isPublished;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        setState(() {
          _selectedImage = File(pickedFile.path);
          _useImageUrl = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to pick image: $e'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showImagePickerOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(AppTheme.spacingL),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppTheme.radiusXL),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppTheme.spacingL),
              decoration: BoxDecoration(
                color: AppTheme.dividerColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Text(
              'Choose Image Source',
              style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingL),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.camera_alt, color: AppTheme.primaryColor),
              ),
              title: const Text('Take Photo'),
              subtitle: const Text('Use camera to capture'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.photo_library, color: AppTheme.accentColor),
              ),
              title: const Text('Choose from Gallery'),
              subtitle: const Text('Select existing photo'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.link, color: Colors.blue),
              ),
              title: const Text('Use URL'),
              subtitle: const Text('Enter image link'),
              onTap: () {
                Navigator.pop(ctx);
                setState(() {
                  _useImageUrl = true;
                  _selectedImage = null;
                });
              },
            ),
            const SizedBox(height: AppTheme.spacingS),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePreview() {
    if (_selectedImage != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          Image.file(
            _selectedImage!,
            fit: BoxFit.cover,
          ),
          Positioned(
            top: 8,
            right: 8,
            child: GestureDetector(
              onTap: () => setState(() => _selectedImage = null),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppTheme.errorColor,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, color: Colors.white, size: 16),
              ),
            ),
          ),
        ],
      );
    }

    if (_useImageUrl && _imageUrlController.text.isNotEmpty) {
      return Stack(
        fit: StackFit.expand,
        children: [
          CachedNetworkImage(
            imageUrl: _imageUrlController.text,
            fit: BoxFit.cover,
            placeholder: (context, url) => const Center(
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            errorWidget: (context, url, error) => const Center(
              child: Icon(Icons.error_outline, color: AppTheme.errorColor, size: 32),
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: GestureDetector(
              onTap: () => setState(() => _imageUrlController.clear()),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppTheme.errorColor,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, color: Colors.white, size: 16),
              ),
            ),
          ),
        ],
      );
    }

    final category = _categories.firstWhere((c) => c['value'] == _selectedCategory);
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          category['icon'] as IconData,
          size: 48,
          color: (category['color'] as Color).withValues(alpha: 0.5),
        ),
        const SizedBox(height: 8),
        Text(
          'Tap to add image',
          style: TextStyle(color: AppTheme.textHint, fontSize: 12),
        ),
      ],
    );
  }

  Future<void> _saveNews() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      String? imageUrl;

      // Upload image to Firebase Storage if a file is selected
      if (_selectedImage != null) {
        final bytes = await _selectedImage!.readAsBytes();
        final base64Image = base64Encode(bytes);
        final fileName = _selectedImage!.path.split('/').last;
        final extension = fileName.split('.').last.toLowerCase();
        final mimeType = extension == 'png' ? 'image/png' : 'image/jpeg';

        imageUrl = await _apiService.uploadImage(
          base64Image: base64Image,
          fileName: fileName,
          folder: 'news',
          mimeType: mimeType,
        );
      } else if (_useImageUrl && _imageUrlController.text.trim().isNotEmpty) {
        imageUrl = _imageUrlController.text.trim();
      }

      if (isEditing) {
        await _apiService.updateNews(
          newsId: widget.news!.id,
          title: _titleController.text.trim(),
          content: _contentController.text.trim(),
          category: _selectedCategory,
          imageURL: imageUrl,
          isPublished: _isPublished,
        );
      } else {
        await _apiService.createNews(
          title: _titleController.text.trim(),
          content: _contentController.text.trim(),
          category: _selectedCategory,
          imageURL: imageUrl,
          isPublished: _isPublished,
        );
      }

      if (!mounted) return;

      widget.onSaved();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text(isEditing ? 'News updated successfully' : 'News created successfully'),
            ],
          ),
          backgroundColor: AppTheme.successColor,
        ),
      );

      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit News' : 'Create News'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveNews,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppTheme.spacingM),
          children: [
            // Image Section
            GestureDetector(
              onTap: _showImagePickerOptions,
              child: Container(
                height: 200,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceMedium,
                  borderRadius: BorderRadius.circular(AppTheme.radiusL),
                  border: Border.all(color: AppTheme.dividerColor, width: 2),
                ),
                clipBehavior: Clip.antiAlias,
                child: _buildImagePreview(),
              ),
            ),
            const SizedBox(height: AppTheme.spacingS),
            // URL input when in URL mode
            if (_useImageUrl && _selectedImage == null)
              TextFormField(
                controller: _imageUrlController,
                decoration: const InputDecoration(
                  labelText: 'Image URL (optional)',
                  hintText: 'https://example.com/image.jpg',
                  prefixIcon: Icon(Icons.link),
                ),
                keyboardType: TextInputType.url,
                onChanged: (_) => setState(() {}),
              ),
            const SizedBox(height: AppTheme.spacingL),

            // Title
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title *',
                hintText: 'Enter news title',
                prefixIcon: Icon(Icons.title),
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Title is required' : null,
              maxLength: 100,
            ),
            const SizedBox(height: AppTheme.spacingM),

            // Category Selection
            Text(
              'Category',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: AppTheme.spacingS),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories.map((category) {
                final isSelected = _selectedCategory == category['value'];
                final color = category['color'] as Color;
                return ChoiceChip(
                  selected: isSelected,
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        category['icon'] as IconData,
                        size: 16,
                        color: isSelected ? Colors.white : color,
                      ),
                      const SizedBox(width: 4),
                      Text(category['label'] as String),
                    ],
                  ),
                  selectedColor: color,
                  onSelected: (selected) {
                    setState(() => _selectedCategory = category['value'] as String);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Content
            TextFormField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: 'Content *',
                hintText: 'Enter news content',
                alignLabelWithHint: true,
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Content is required' : null,
              maxLines: 8,
              minLines: 5,
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Publish Toggle
            ModernCard(
              child: SwitchListTile(
                title: const Text('Publish immediately'),
                subtitle: Text(
                  _isPublished
                      ? 'This news will be visible to all users'
                      : 'This news will be saved as a draft',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                ),
                value: _isPublished,
                onChanged: (value) => setState(() => _isPublished = value),
                secondary: Icon(
                  _isPublished ? Icons.visibility : Icons.visibility_off,
                  color: _isPublished ? AppTheme.successColor : AppTheme.textHint,
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingXL),

            // Save Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveNews,
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(isEditing ? 'Update News' : 'Create News'),
              ),
            ),
            const SizedBox(height: AppTheme.spacingXL),
          ],
        ),
      ),
    );
  }
}
