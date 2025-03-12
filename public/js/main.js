// Wait for the DOM to be fully loaded
$(document).ready(function() {
  // Auto-dismiss alerts after 5 seconds
  $('.alert').each(function() {
    const alert = $(this);
    setTimeout(function() {
      alert.find('.btn-close').click();
    }, 5000);
  });

  // Enable tooltips
  $('[data-bs-toggle="tooltip"]').tooltip();

  // Confirm delete actions
  $('.btn-delete').on('click', function(e) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      e.preventDefault();
    }
  });

  // Toggle internal comment checkbox based on user role
  $('#comment-type-toggle').on('change', function() {
    const isChecked = $(this).prop('checked');
    $('#internal-comment-info').toggle(isChecked);
  });

  // Filter tickets by status
  $('#ticket-status-filter').on('change', function() {
    const selectedStatus = $(this).val();
    $('.ticket-row').each(function() {
      const ticketStatus = $(this).data('status');
      $(this).toggle(selectedStatus === 'all' || ticketStatus === selectedStatus);
    });
  });

  // Equipment warranty expiration warning
  $('.warranty-date').each(function() {
    const warrantyDate = new Date($(this).data('date'));
    const today = new Date();
    const diffTime = warrantyDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      $(this).addClass('text-danger')
             .attr('data-bs-toggle', 'tooltip')
             .attr('data-bs-placement', 'top')
             .attr('title', 'Warranty expired');
    } else if (diffDays < 30) {
      $(this).addClass('text-warning')
             .attr('data-bs-toggle', 'tooltip')
             .attr('data-bs-placement', 'top')
             .attr('title', `Warranty expires in ${diffDays} days`);
    }
  });
}); 