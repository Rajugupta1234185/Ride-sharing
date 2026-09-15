import 'package:flutter/material.dart';

import '../../../../core/theme/app_color.dart';
import '../../domain/models/place_search_result.dart';
import 'common_controls.dart';

class DestinationSearchOverlay extends StatelessWidget {
  const DestinationSearchOverlay({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.isSearching,
    required this.results,
    required this.onChanged,
    required this.onClear,
    required this.onClose,
    required this.onSelect,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isSearching;
  final List<PlaceSearchResult> results;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;
  final VoidCallback onClose;
  final ValueChanged<PlaceSearchResult> onSelect;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Stack(
      children: [
        Positioned(
          top: topPadding + 12,
          left: 16,
          right: 16,
          child: Row(
            children: [
              FloatingIconButton(
                icon: Icons.arrow_back_rounded,
                onTap: onClose,
              ),
              const SizedBox(width: 10),
              Expanded(child: _searchField()),
            ],
          ),
        ),
        if (isSearching)
          Positioned(
            top: topPadding + 78,
            left: 16,
            right: 16,
            child: _loadingCard(),
          ),
        if (!isSearching && results.isNotEmpty)
          Positioned(
            top: topPadding + 78,
            left: 16,
            right: 16,
            child: _resultsList(),
          ),
      ],
    );
  }

  Widget _searchField() {
    return Container(
      height: 54,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 18,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        autofocus: true,
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Search destination',
          hintStyle:
              const TextStyle(color: AppColors.textSecondary, fontSize: 15),
          prefixIcon: const Icon(Icons.search_rounded,
              color: AppColors.primary),
          suffixIcon: controller.text.isNotEmpty
              ? IconButton(
                  onPressed: onClear,
                  icon: const Icon(Icons.close_rounded),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Widget _loadingCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 18,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: const Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          SizedBox(width: 12),
          Text(
            'Searching places...',
            style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _resultsList() {
    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(maxHeight: 330),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ListView.separated(
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(vertical: 6),
          itemCount: results.length,
          separatorBuilder: (_, __) =>
              const Divider(height: 1, indent: 62),
          itemBuilder: (context, index) {
            final place = results[index];

            return ListTile(
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
              onTap: () => onSelect(place),
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.10),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.location_on_outlined,
                  color: AppColors.primary,
                  size: 21,
                ),
              ),
              title: Text(
                place.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              subtitle: place.address.isNotEmpty
                  ? Text(
                      place.address,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    )
                  : null,
              trailing: const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textSecondary,
              ),
            );
          },
        ),
      ),
    );
  }
}